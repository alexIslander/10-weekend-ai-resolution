export const formatCents = (cents: number) =>
  `$${(cents / 100).toFixed(2)}`;

export const nowIso = () => new Date().toISOString();

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
