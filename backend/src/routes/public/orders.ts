import { Router } from 'express';
import { asyncHandler, HttpError } from '../../middleware/error';
import { createOrder, findOrderByNumber } from '../../services/order.service';
import { createOrderSchema } from '../../validators/schemas';

const router = Router();

/**
 * POST /api/orders → place an order (Cash on Delivery).
 * All pricing is computed server-side.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const order = await createOrder(input);
    res.status(201).json({ order });
  }),
);

/**
 * POST /api/orders/:slug → place an order for a specific product.
 */
router.post(
  '/:slug',
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse({ ...req.body, productSlug: req.params.slug });
    const order = await createOrder(input);
    res.status(201).json({ order });
  }),
);

/** GET /api/orders/:orderNumber → order lookup for the confirmation page. */
router.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await findOrderByNumber(req.params.orderNumber);
    if (!order) {
      throw new HttpError(404, 'Order not found');
    }
    res.json({ order });
  }),
);

export default router;
