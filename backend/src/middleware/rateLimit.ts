import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error';

interface Attempt {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** Simple in-memory brute-force protection for the admin login endpoint. */
const attempts = new Map<string, Attempt>();

// Periodically evict expired entries so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.resetAt < now) attempts.delete(key);
  }
}, WINDOW_MS).unref();

export function loginRateLimit(req: Request, _res: Response, next: NextFunction) {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();

  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  current.count += 1;
  if (current.count > MAX_ATTEMPTS) {
    const mins = Math.ceil((current.resetAt - now) / 60000);
    return next(
      new HttpError(429, `Too many login attempts. Try again in ${mins} minute(s).`),
    );
  }
  next();
}
