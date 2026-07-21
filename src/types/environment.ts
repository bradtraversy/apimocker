export const environmentResources = [
  'users',
  'posts',
  'todos',
  'comments',
  'likes',
] as const;

export type EnvironmentResource = (typeof environmentResources)[number];

export type EnvironmentRecord = {
  id: number;
  [key: string]: unknown;
};

export type EnvironmentCollectionState = {
  data: EnvironmentRecord[];
  seedData?: EnvironmentRecord[];
  nextId: number;
  seedNextId?: number;
  version: number;
};

export type EnvironmentState = Partial<
  Record<EnvironmentResource, EnvironmentCollectionState>
>;

export type ApiEnvironmentContext = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  requestLimit: number;
  requestsUsed: number;
  periodStart: Date;
  periodEnd: Date;
  burstLimit: number;
  burstRequests: number;
  burstWindowStart: Date;
  maxRecords: number;
};
