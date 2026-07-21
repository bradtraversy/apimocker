import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { ApiEnvironmentContext } from '../types/environment';
import { apiKeyMatches } from '../utils/apiKey';
import { addMonth, burstWindowEnd } from '../utils/environmentQuota';

export const environmentAttemptRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) =>
    res.locals['environmentAuthFailed'] !== true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many environment access attempts from this IP',
  },
});

export const environmentPayloadError: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  const status = (error as { status?: number }).status;
  if (status === 413) {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'Isolated environment request bodies are limited to 64 KB',
    });
    return;
  }

  next(error);
};

const environmentSelect = {
  id: true,
  slug: true,
  name: true,
  apiKeyHash: true,
  managementKeyHash: true,
  plan: true,
  active: true,
  requestLimit: true,
  requestsUsed: true,
  periodStart: true,
  periodEnd: true,
  burstLimit: true,
  burstRequests: true,
  burstWindowStart: true,
  maxRecords: true,
} as const;

const consumePersistentQuota = async (environmentId: string, now: Date) =>
  prisma.$transaction(async transaction => {
    const model = transaction.apiEnvironment;
    const burstCutoff = new Date(now.getTime() - 60_000);

    await model.updateMany({
      where: {
        id: environmentId,
        active: true,
        periodEnd: { lte: now },
      },
      data: {
        requestsUsed: 0,
        periodStart: now,
        periodEnd: addMonth(now),
      },
    });

    await model.updateMany({
      where: {
        id: environmentId,
        active: true,
        burstWindowStart: { lte: burstCutoff },
      },
      data: {
        burstRequests: 0,
        burstWindowStart: now,
      },
    });

    const incremented = await model.updateMany({
      where: {
        id: environmentId,
        active: true,
        periodEnd: { gt: now },
        requestsUsed: { lt: model.fields.requestLimit },
        burstWindowStart: { gt: burstCutoff },
        burstRequests: { lt: model.fields.burstLimit },
      },
      data: {
        requestsUsed: { increment: 1 },
        burstRequests: { increment: 1 },
      },
    });

    const environment = await model.findUnique({
      where: { id: environmentId },
      select: environmentSelect,
    });

    if (incremented.count === 1) {
      return { environment, denied: null };
    }

    const denied = environment && environment.requestsUsed >= environment.requestLimit
      ? 'monthly'
      : 'burst';
    return { environment, denied };
  });

const setQuotaHeaders = (res: Response, environment: ApiEnvironmentContext) => {
  const burstReset = burstWindowEnd(environment.burstWindowStart);
  res.set({
    'X-RateLimit-Limit': environment.requestLimit.toString(),
    'X-RateLimit-Remaining': Math.max(
      environment.requestLimit - environment.requestsUsed,
      0
    ).toString(),
    'X-RateLimit-Reset': environment.periodEnd.toISOString(),
    'X-BurstLimit-Limit': environment.burstLimit.toString(),
    'X-BurstLimit-Remaining': Math.max(
      environment.burstLimit - environment.burstRequests,
      0
    ).toString(),
    'X-BurstLimit-Reset': burstReset.toISOString(),
    'Access-Control-Expose-Headers': [
      'X-Total-Count',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-BurstLimit-Limit',
      'X-BurstLimit-Remaining',
      'X-BurstLimit-Reset',
    ].join(', '),
  });
};

export const requireEnvironmentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.params['slug'];
    const apiKey = req.header('X-API-Key');

    if (!slug || !apiKey) {
      res.locals['environmentAuthFailed'] = true;
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'A valid X-API-Key header is required',
      });
    }

    const environment = await prisma.apiEnvironment.findUnique({
      where: { slug },
      select: environmentSelect,
    });

    if (!environment || !apiKeyMatches(apiKey, environment.apiKeyHash)) {
      res.locals['environmentAuthFailed'] = true;
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'A valid X-API-Key header is required',
      });
    }

    if (!environment.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This environment is inactive',
      });
    }

    const metered = await consumePersistentQuota(environment.id, new Date());
    if (!metered.environment) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This environment is unavailable',
      });
    }

    if (!metered.environment.active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This environment is inactive',
      });
    }

    const context: ApiEnvironmentContext = {
      id: metered.environment.id,
      slug: metered.environment.slug,
      name: metered.environment.name,
      plan: metered.environment.plan,
      requestLimit: metered.environment.requestLimit,
      requestsUsed: metered.environment.requestsUsed,
      periodStart: metered.environment.periodStart,
      periodEnd: metered.environment.periodEnd,
      burstLimit: metered.environment.burstLimit,
      burstRequests: metered.environment.burstRequests,
      burstWindowStart: metered.environment.burstWindowStart,
      maxRecords: metered.environment.maxRecords,
    };

    setQuotaHeaders(res, context);

    if (metered.denied) {
      const burstReset = burstWindowEnd(context.burstWindowStart);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: metered.denied === 'monthly'
          ? 'Monthly environment request limit exceeded'
          : `Burst limit exceeded. Maximum ${context.burstLimit} requests per minute.`,
        resetTime: metered.denied === 'monthly'
          ? context.periodEnd.toISOString()
          : burstReset.toISOString(),
      });
    }

    res.locals['apiEnvironment'] = context;
    res.locals['managementKeyHash'] = metered.environment.managementKeyHash;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireManagementAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const managementKey = req.header('X-Management-Key');
  const expectedHash = res.locals['managementKeyHash'] as string | undefined;

  if (!managementKey || !expectedHash || !apiKeyMatches(managementKey, expectedHash)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'A valid X-Management-Key header is required',
    });
  }

  return next();
};

export const getEnvironmentContext = (res: Response) =>
  res.locals['apiEnvironment'] as ApiEnvironmentContext;
