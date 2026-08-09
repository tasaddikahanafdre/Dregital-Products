import { Router } from 'express';
import { asyncHandler } from '../../middleware/error';
import { getSettings } from '../../services/settings.service';

const router = Router();

/**
 * GET /api/settings → public store settings needed by the storefront:
 * delivery charges (for checkout totals) and the promo video info.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const s = await getSettings();
    res.json({
      deliveryChargeInsideDhaka: Number(s.delivery_charge_inside_dhaka),
      deliveryChargeOutsideDhaka: Number(s.delivery_charge_outside_dhaka),
      video: {
        url: s.video_url ?? '',
        type: s.video_type ?? 'none',
        thumbnailUrl: s.video_thumbnail_url ?? null,
      },
    });
  }),
);

export default router;
