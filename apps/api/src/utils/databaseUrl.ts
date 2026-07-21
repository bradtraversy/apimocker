export const databaseSchemaFromUrl = (connectionString: string) => {
  const schema = new URL(connectionString).searchParams.get('schema');
  return schema || undefined;
};
