import { createHash, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { env } from '../../config/env';
import { ADMIN_COOKIE_NAME, cookieOptions, signAdminToken } from '../../lib/auth';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler, HttpError } from '../../middleware/error';
import { loginRateLimit } from '../../middleware/rateLimit';
import { loginSchema } from '../../validators/schemas';

const router = Router();

/** Constant-time string comparison to avoid timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const hash = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/**
 * POST /api/admin/auth/login
 * Admin credentials are stored in backend environment variables and are
 * verified here — never in the frontend. A successful login issues a JWT
 * stored in an httpOnly cookie.
 */
router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const valid =
      safeEqual(username, env.ADMIN_USERNAME) && safeEqual(password, env.ADMIN_PASSWORD);

    if (!valid) {
      throw new HttpError(401, 'Invalid username or password.');
    }

    const token = signAdminToken();
    res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions());
    res.json({ ok: true, username: env.ADMIN_USERNAME });
  }),
);

/** POST /api/admin/auth/logout → clears the session cookie. */
router.post('/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions());
  res.json({ ok: true });
});

/** GET /api/admin/auth/me → tells the dashboard whether the session is valid. */
router.get('/me', requireAdmin, (_req, res) => {
  res.json({ ok: true, username: env.ADMIN_USERNAME });
});

export default router;
