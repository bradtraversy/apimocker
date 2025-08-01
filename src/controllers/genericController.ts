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
      // Handle response delay simulation
      const delay = Number(req.query['_delay'] || 0);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Handle both page/limit and _page/_limit parameters
      const page = Number(req.query['page'] || req.query['_page'] || 1);
      const limit = Number(req.query['limit'] || req.query['_limit'] || 10);
      const skip = (page - 1) * limit;

      // Handle sorting
      const sortField = req.query['_sort'] as string || 'id';
      const sortOrder = req.query['_order'] as string || 'asc';
      const orderBy = { [sortField]: sortOrder };

      // Build where clause from query parameters
      const where: any = {};
      Object.keys(req.query).forEach((key) => {
        if (
          key !== '_limit' &&
          key !== '_page' &&
          key !== 'page' &&
          key !== 'limit' &&
          key !== '_sort' &&
          key !== '_order' &&
          key !== '_delay'
        ) {
          const value = req.query[key];

          // Handle special filtering cases
          if (key.endsWith('_like')) {
            // Handle partial text matching (e.g., title_like)
            const fieldName = key.replace('_like', '');
            where[fieldName] = {
              contains: value as string,
              mode: 'insensitive', // Case-insensitive search
            };
          } else if (key === 'userId' || key === 'id') {
            where[key] = Number(value);
          } else if (key === 'completed') {
            where[key] = value === 'true';
          } else {
            where[key] = value;
          }
        }
      });

      const model = this.prisma[this.modelName as keyof PrismaClient] as any;
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: Number(limit),
          include: this.includeRelations,
          orderBy,
        }),
        model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      // Add response headers for pagination info
      res.set({
        'X-Total-Count': total.toString(),
        'Access-Control-Expose-Headers': 'X-Total-Count',
      });

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
      // Handle response delay simulation
      const delay = Number(req.query['_delay'] || 0);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

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

      return res.json({ data });
    } catch (error) {
      return next(error);
    }
  };

  // Create new resource
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const model = this.prisma[this.modelName as keyof PrismaClient] as any;
      
      // Set default userId to 1 for posts and todos if not provided
      const createData = { ...req.body };
      if ((this.modelName === 'post' || this.modelName === 'todo') && !createData.userId) {
        createData.userId = 1;
      }
      
      const data = await model.create({
        data: createData,
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

      // Set default userId to 1 for posts and todos if not provided
      const updateData = { ...req.body };
      if ((this.modelName === 'post' || this.modelName === 'todo') && !updateData.userId) {
        updateData.userId = 1;
      }

      const data = await model.update({
        where: { id: Number(id) },
        data: updateData,
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
      // Handle both page/limit and _page/_limit parameters
      const page = Number(req.query['page'] || req.query['_page'] || 1);
      const limit = Number(req.query['limit'] || req.query['_limit'] || 10);
      const skip = (page - 1) * limit;
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
