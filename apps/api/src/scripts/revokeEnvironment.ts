import { prisma } from '../lib/prisma';
import { parseEnvironmentArgs } from './environmentArgs';

const revokeEnvironment = async () => {
  const args = parseEnvironmentArgs(process.argv.slice(2));
  const slug = args.get('slug');

  if (!slug) {
    throw new Error('Provide the environment slug with --slug');
  }

  const updated = await prisma.apiEnvironment.updateMany({
    where: { slug },
    data: { active: false },
  });

  if (updated.count === 0) {
    throw new Error(`Environment ${slug} was not found`);
  }

  process.stdout.write(`Environment ${slug} revoked\n`);
};

revokeEnvironment()
  .catch(error => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`Failed to revoke environment: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
