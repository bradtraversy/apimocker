import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  EnvironmentCollectionState,
  EnvironmentRecord,
  EnvironmentResource,
  EnvironmentState,
} from '../types/environment';
import { cloneRecords } from './environmentData';
import { EnvironmentDataError } from './environmentData';

type MutationResult<T> = {
  changed: EnvironmentResource[];
  value: T;
};

class EnvironmentVersionConflict extends Error {}

const toRecords = (value: Prisma.JsonValue) => {
  if (!Array.isArray(value)) {
    throw new Error('Environment collection data must be an array');
  }

  return cloneRecords(value as unknown as EnvironmentRecord[]);
};

const toJson = (records: EnvironmentRecord[]) =>
  records as unknown as Prisma.InputJsonValue;

export class EnvironmentStore {
  constructor(private readonly client: PrismaClient) {}

  private makeState(
    collections: Array<{
      resource: string;
      data: Prisma.JsonValue;
      seedData?: Prisma.JsonValue;
      nextId: number;
      seedNextId?: number;
      version: number;
    }>
  ) {
    return collections.reduce<EnvironmentState>((state, collection) => {
      const resource = collection.resource as EnvironmentResource;
      const stateCollection: EnvironmentCollectionState = {
        data: toRecords(collection.data),
        nextId: collection.nextId,
        version: collection.version,
      };
      if (collection.seedData !== undefined && collection.seedNextId !== undefined) {
        stateCollection.seedData = toRecords(collection.seedData);
        stateCollection.seedNextId = collection.seedNextId;
      }
      state[resource] = stateCollection;
      return state;
    }, {});
  }

  async read(environmentId: string, resources: EnvironmentResource[]) {
    const collections = await this.client.environmentCollection.findMany({
      where: {
        environmentId,
        resource: { in: resources },
      },
      select: {
        resource: true,
        data: true,
        nextId: true,
        version: true,
      },
    });

    if (collections.length !== resources.length) {
      throw new Error('One or more environment collections are missing');
    }

    return this.makeState(collections);
  }

  async mutate<T>(
    environmentId: string,
    resources: EnvironmentResource[],
    mutator: (state: EnvironmentState) => MutationResult<T>,
    includeSeedData = false
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.client.$transaction(async transaction => {
          const collectionModel = transaction.environmentCollection;
          const collections = await collectionModel.findMany({
            where: {
              environmentId,
              resource: { in: resources },
            },
            select: {
              resource: true,
              data: true,
              nextId: true,
              version: true,
              ...(includeSeedData ? { seedData: true, seedNextId: true } : {}),
            },
          });

          if (collections.length !== resources.length) {
            throw new Error('One or more environment collections are missing');
          }

          const state = this.makeState(collections);
          const mutation = mutator(state);

          for (const resource of mutation.changed) {
            const collection = state[resource] as EnvironmentCollectionState | undefined;
            if (!collection) {
              throw new Error(`Collection ${resource} was not loaded for mutation`);
            }

            const updated = await collectionModel.updateMany({
              where: {
                environmentId,
                resource,
                version: collection.version,
              },
              data: {
                data: toJson(collection.data),
                nextId: collection.nextId,
                version: { increment: 1 },
              },
            });

            if (updated.count !== 1) {
              throw new EnvironmentVersionConflict();
            }
          }

          return mutation.value;
        });
      } catch (error) {
        if (error instanceof EnvironmentVersionConflict) {
          if (attempt < 2) {
            continue;
          }
          throw new EnvironmentDataError(
            'Environment changed during this request. Retry the operation.',
            409
          );
        }
        throw error;
      }
    }

    throw new EnvironmentDataError(
      'Environment changed during this request. Retry the operation.',
      409
    );
  }
}
