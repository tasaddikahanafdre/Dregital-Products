import type { NextFunction, Request, Response } from 'express';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '../lib/auth';
import { HttpError } from './error';

/**
 * Protects admin-only routes. The admin session lives in an httpOnly cookie,
 * so we read the token from cookies (never from the frontend code) and verify
 * its signature against the backend secret.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token || !verifyAdminToken(token)) {
    return next(new HttpError(401, 'Unauthorized. Please log in to continue.'));
  }
  next();
}
