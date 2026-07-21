export const addMonth = (date: Date) => {
  const next = new Date(date);
  const targetMonth = next.getUTCMonth() + 1;
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(targetMonth);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
};

export const burstWindowEnd = (windowStart: Date) =>
  new Date(windowStart.getTime() + 60_000);
