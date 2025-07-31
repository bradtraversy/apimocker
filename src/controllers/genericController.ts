import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface QueryOptions {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export class GenericController {
  private prisma: PrismaClient;
  private modelName: string;
  private includeRelations?: any;

  constructor(prisma: PrismaClient, modelName: string, includeRelations?: any) {
    this.prisma = prisma;
    this.modelName = modelName;
    this.includeRelations = includeRelations;
  }

  // Get all resources with pagination and filtering
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause from query parameters
      const where: any = {};
      Object.keys(filters).forEach((key) => {
        if (key !== '_limit' && key !== '_page') {
          where[key] = filters[key];
        }
      });

      const model = this.prisma[this.modelName as keyof PrismaClient] as any;
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: Number(limit),
          include: this.includeRelations,
          orderBy: { id: 'asc' },
        }),
        model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get single resource by ID
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const model = this.prisma[this.modelName as keyof PrismaClient] as any;

      const data = await model.findUnique({
        where: { id: Number(id) },
        include: this.includeRelations,
      });

      if (!data) {
        return res.status(404).json({
          error: 'Not Found',
          message: `${this.modelName} with id ${id} not found`,
        });
      }

      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  // Create new resource
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model = this.prisma[this.modelName as keyof PrismaClient] as any;
      const data = await model.create({
        data: req.body,
        include: this.includeRelations,
      });

      logger.info(`Created ${this.modelName}`, { id: data.id });
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  // Update resource by ID
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const model = this.prisma[this.modelName as keyof PrismaClient] as any;

      const data = await model.update({
        where: { id: Number(id) },
        data: req.body,
        include: this.includeRelations,
      });

      logger.info(`Updated ${this.modelName}`, { id: data.id });
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };

  // Delete resource by ID
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const model = this.prisma[this.modelName as keyof PrismaClient] as any;

      await model.delete({
        where: { id: Number(id) },
      });

      logger.info(`Deleted ${this.modelName}`, { id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // Get related resources (e.g., user's posts)
  getRelated = async (
    req: Request,
    res: Response,
    next: NextFunction,
    relationModel: string,
    foreignKey: string
  ) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const model = this.prisma[relationModel as keyof PrismaClient] as any;

      const [data, total] = await Promise.all([
        model.findMany({
          where: { [foreignKey]: Number(id) },
          skip,
          take: Number(limit),
          orderBy: { id: 'asc' },
        }),
        model.count({
          where: { [foreignKey]: Number(id) },
        }),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
