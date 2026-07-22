import { resolveResetSchedulerMode } from '../../src/utils/resetScheduler';

describe('resolveResetSchedulerMode', () => {
  it('defaults to the in-process scheduler', () => {
    expect(resolveResetSchedulerMode(undefined)).toBe('in_process');
  });

  it.each(['in_process', 'external', 'disabled'] as const)(
    'accepts %s',
    mode => {
      expect(resolveResetSchedulerMode(mode)).toBe(mode);
    }
  );

  it('trims the configured mode', () => {
    expect(resolveResetSchedulerMode(' external ')).toBe('external');
  });

  it('rejects an unsupported mode', () => {
    expect(() => resolveResetSchedulerMode('railway')).toThrow(
      'RESET_SCHEDULER must be one of: in_process, external, disabled'
    );
  });
});
