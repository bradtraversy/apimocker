import { assertTestDatabaseIsIsolated } from '../utils/testDatabaseSafety';

describe('assertTestDatabaseIsIsolated', () => {
  const unsafeTargetError =
    'TEST_DATABASE_URL must not target the same host and database as DATABASE_URL';

  it('treats localhost and IPv4 loopback as the same host', () => {
    expect(() =>
      assertTestDatabaseIsIsolated(
        'postgresql://test:test@localhost:5432/apimocker_test',
        'postgresql://test:test@127.0.0.1:5432/apimocker_test'
      )
    ).toThrow(unsafeTargetError);
  });

  it('treats bracketed IPv6 loopback and localhost as the same host', () => {
    expect(() =>
      assertTestDatabaseIsIsolated(
        'postgresql://test:test@[::1]:5432/apimocker_test',
        'postgresql://test:test@localhost:5432/apimocker_test'
      )
    ).toThrow(unsafeTargetError);
  });

  it('allows different databases across loopback aliases', () => {
    expect(() =>
      assertTestDatabaseIsIsolated(
        'postgresql://test:test@[::1]:5432/apimocker_test',
        'postgresql://test:test@127.0.0.1:5432/apimocker'
      )
    ).not.toThrow();
  });
});
