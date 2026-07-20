-- CreateTable
CREATE TABLE "api_environments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "managementKeyHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'developer',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "requestLimit" INTEGER NOT NULL,
    "requestsUsed" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "burstLimit" INTEGER NOT NULL,
    "burstRequests" INTEGER NOT NULL DEFAULT 0,
    "burstWindowStart" TIMESTAMP(3) NOT NULL,
    "maxRecords" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_collections" (
    "environmentId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "seedData" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "nextId" INTEGER NOT NULL,
    "seedNextId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_collections_pkey" PRIMARY KEY ("environmentId","resource")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_environments_slug_key" ON "api_environments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "api_environments_apiKeyHash_key" ON "api_environments"("apiKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "api_environments_managementKeyHash_key" ON "api_environments"("managementKeyHash");

-- AddForeignKey
ALTER TABLE "environment_collections" ADD CONSTRAINT "environment_collections_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "api_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
