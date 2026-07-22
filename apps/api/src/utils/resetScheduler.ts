const resetSchedulerModes = ['in_process', 'external', 'disabled'] as const;

export type ResetSchedulerMode = (typeof resetSchedulerModes)[number];

export const resolveResetSchedulerMode = (
  value = process.env['RESET_SCHEDULER']
): ResetSchedulerMode => {
  const mode = value?.trim() || 'in_process';

  if (!resetSchedulerModes.includes(mode as ResetSchedulerMode)) {
    throw new Error(
      `RESET_SCHEDULER must be one of: ${resetSchedulerModes.join(', ')}`
    );
  }

  return mode as ResetSchedulerMode;
};
