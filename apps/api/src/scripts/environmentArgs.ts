export const parseEnvironmentArgs = (args: string[]) => {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument?.startsWith('--') && value && !value.startsWith('--')) {
      values.set(argument.slice(2), value);
      index += 1;
    }
  }

  return values;
};

export const positiveIntegerArg = (
  value: string | undefined,
  fallback: number,
  name: string
) => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
};

export const assertMaxRecordsCoversSnapshots = (
  maxRecords: number,
  snapshots: Record<string, unknown[]>
) => {
  const largestSnapshot = Object.entries(snapshots).reduce(
    (largest, [resource, records]) =>
      records.length > largest.count
        ? { resource, count: records.length }
        : largest,
    { resource: '', count: 0 }
  );

  if (maxRecords < largestSnapshot.count) {
    throw new Error(
      `--max-records must be at least ${largestSnapshot.count} to fit the ${largestSnapshot.resource} seed data`
    );
  }
};
