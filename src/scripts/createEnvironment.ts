import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { EnvironmentRecord, environmentResources } from '../types/environment';
import {
  generateApiKey,
  generateManagementKey,
  hashApiKey,
} from '../utils/apiKey';
import { addMonth } from '../utils/environmentQuota';
import { parseEnvironmentArgs, positiveIntegerArg } from './environmentArgs';

const toJson = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const nextIdFor = (records: EnvironmentRecord[]) =>
  records.reduce((largest, record) => Math.max(largest, record.id), 0) + 1;

const planDefaults = {
  developer: {
    requestLimit: 25_000,
    burstLimit: 120,
    maxRecords: 1_000,
  },
  classroom: {
    requestLimit: 100_000,
    burstLimit: 240,
    maxRecords: 2_000,
  },
} as const;

const createEnvironment = async () => {
  const args = parseEnvironmentArgs(process.argv.slice(2));
  const slug = args.get('slug');

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      'Provide --slug using lowercase letters, numbers, and single hyphens'
    );
  }

  const name = args.get('name') || slug;
  const plan = args.get('plan') || 'developer';
  if (!Object.prototype.hasOwnProperty.call(planDefaults, plan)) {
    throw new Error('--plan must be developer or classroom');
  }
  const defaults = planDefaults[plan as keyof typeof planDefaults];
  const requestLimit = positiveIntegerArg(
    args.get('request-limit'),
    defaults.requestLimit,
    '--request-limit'
  );
  const maxRecords = positiveIntegerArg(
    args.get('max-records'),
    defaults.maxRecords,
    '--max-records'
  );
  const burstLimit = positiveIntegerArg(
    args.get('burst-limit'),
    defaults.burstLimit,
    '--burst-limit'
  );

  const apiKey = generateApiKey();
  const managementKey = generateManagementKey();
  const now = new Date();

  await prisma.$transaction(
    async transaction => {
      const [users, posts, todos, comments, likes] = await Promise.all([
        transaction.user.findMany({ orderBy: { id: 'asc' } }),
        transaction.post.findMany({ orderBy: { id: 'asc' } }),
        transaction.todo.findMany({ orderBy: { id: 'asc' } }),
        transaction.comment.findMany({ orderBy: { id: 'asc' } }),
        transaction.like.findMany({ orderBy: { id: 'asc' } }),
      ]);

      if (!users.length || !posts.length || !todos.length || !comments.length) {
        throw new Error('Global seed data is missing. Run npm run db:seed first.');
      }

      const snapshots: Record<string, EnvironmentRecord[]> = {
        users: toJson(users) as unknown as EnvironmentRecord[],
        posts: toJson(posts) as unknown as EnvironmentRecord[],
        todos: toJson(todos) as unknown as EnvironmentRecord[],
        comments: toJson(comments) as unknown as EnvironmentRecord[],
        likes: toJson(likes) as unknown as EnvironmentRecord[],
      };

      await transaction.apiEnvironment.create({
        data: {
          slug,
          name,
          apiKeyHash: hashApiKey(apiKey),
          managementKeyHash: hashApiKey(managementKey),
          plan,
          requestLimit,
          periodStart: now,
          periodEnd: addMonth(now),
          burstLimit,
          burstWindowStart: now,
          maxRecords,
          collections: {
            create: environmentResources.map(resource => {
              const records = snapshots[resource] as EnvironmentRecord[];
              const nextId = nextIdFor(records);
              const data = toJson(records);
              return {
                resource,
                seedData: data,
                data,
                nextId,
                seedNextId: nextId,
              };
            }),
          },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );

  process.stdout.write(
    [
      'Environment created successfully',
      `Slug: ${slug}`,
      `Plan: ${plan}`,
      `Monthly requests: ${requestLimit}`,
      `Requests per minute: ${burstLimit}`,
      `Maximum records per resource: ${maxRecords}`,
      `API key: ${apiKey}`,
      `Management key: ${managementKey}`,
      'Store both keys now. Only their SHA-256 hashes were saved.',
      '',
    ].join('\n')
  );
};

createEnvironment()
  .catch(error => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`Failed to create environment: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
