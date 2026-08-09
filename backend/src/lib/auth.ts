import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const ADMIN_COOKIE_NAME = 'pawsum_admin_token';

/** Parse a JWT expiry like "12h", "7d", "30m" into milliseconds. */
export function jwtExpiryToMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry.trim());
  if (!match) return 12 * 60 * 60 * 1000; // fallback: 12h
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
}

/** Options used when setting/clearing the admin session cookie. */
export function cookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    // 'none' allows the cookie to work when frontend & backend are hosted on
    // different domains in production (requires https). Lax is fine in dev.
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    // Keep the cookie alive exactly as long as the JWT itself.
    maxAge: jwtExpiryToMs(env.ADMIN_JWT_EXPIRES_IN),
    path: '/',
  };
}

export function signAdminToken(): string {
  return jwt.sign({ sub: 'admin', role: 'admin' }, env.ADMIN_JWT_SECRET, {
    expiresIn: env.ADMIN_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAdminToken(token: string): boolean {
  try {
    jwt.verify(token, env.ADMIN_JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
