import { databaseSchemaFromUrl } from '../../src/utils/databaseUrl';

describe('databaseSchemaFromUrl', () => {
  it('reads the schema query parameter from a connection URL', () => {
    expect(
      databaseSchemaFromUrl(
        'postgresql://test:test@localhost:5432/apimocker?sslmode=require&schema=gate'
      )
    ).toBe('gate');
  });

  it('returns undefined when the URL does not select a schema', () => {
    expect(
      databaseSchemaFromUrl(
        'postgresql://test:test@localhost:5432/apimocker'
      )
    ).toBeUndefined();
  });
});
