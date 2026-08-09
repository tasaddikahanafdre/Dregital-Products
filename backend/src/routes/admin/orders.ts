import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler, HttpError } from '../../middleware/error';
import {
  getOrderStats,
  listOrders,
  updateOrderStatus,
  ORDER_STATUSES,
} from '../../services/order.service';
import { updateOrderStatusSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAdmin);

/** GET /api/admin/orders?status=pending&page=1&pageSize=20 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const statusParam = String(req.query.status ?? 'all');
    const status = (ORDER_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as (typeof ORDER_STATUSES)[number])
      : 'all';

    const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));

    const result = await listOrders(status, page, pageSize);
    res.json(result);
  }),
);

/** GET /api/admin/orders/stats → aggregate store statistics. */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await getOrderStats();
    res.json({ stats });
  }),
);

/** PATCH /api/admin/orders/:id/status → change order status. */
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = updateOrderStatusSchema.parse(req.body);
    const order = await updateOrderStatus(req.params.id, status);
    res.json({ order });
  }),
);

export default router;
