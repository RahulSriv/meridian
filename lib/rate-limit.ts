const FREE_ANALYSES_PER_DAY = Number(process.env.FREE_ANALYSES_PER_DAY ?? 3);

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const window = store.get(ip);

  if (!window || now > window.resetAt) {
    store.set(ip, { count: 1, resetAt: now + 86_400_000 });
    return { allowed: true, remaining: FREE_ANALYSES_PER_DAY - 1 };
  }

  if (window.count >= FREE_ANALYSES_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  window.count++;
  return { allowed: true, remaining: FREE_ANALYSES_PER_DAY - window.count };
}
