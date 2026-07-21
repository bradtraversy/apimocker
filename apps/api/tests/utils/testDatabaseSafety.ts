const databaseTarget = (connectionString: string) => {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('Test database connection strings must be valid URLs');
  }

  const parsedHostname = parsed.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '');
  const hostname = ['localhost', '127.0.0.1', '::1'].includes(parsedHostname)
    ? 'loopback'
    : parsedHostname.endsWith('.neon.tech')
      ? parsedHostname.replace('-pooler.', '.')
      : parsedHostname;
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')).toLowerCase();

  if (!hostname || !database) {
    throw new Error('Test database connection strings must include a host and database');
  }

  return { hostname, database };
};

export const assertTestDatabaseIsIsolated = (
  testDatabaseUrl: string,
  existingDatabaseUrl: string | undefined
) => {
  if (!existingDatabaseUrl) {
    return;
  }

  const testTarget = databaseTarget(testDatabaseUrl);
  const existingTarget = databaseTarget(existingDatabaseUrl);

  if (
    testTarget.hostname === existingTarget.hostname &&
    testTarget.database === existingTarget.database
  ) {
    throw new Error(
      'TEST_DATABASE_URL must not target the same host and database as DATABASE_URL'
    );
  }
};
