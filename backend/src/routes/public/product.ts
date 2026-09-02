import { Router } from 'express';
import { asyncHandler, HttpError } from '../../middleware/error';
import { listActiveProducts, getProductBySlug } from '../../services/product.service';

const router = Router();

/** GET /api/products → list all active products (shop page). */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const products = await listActiveProducts();
    res.json({ products });
  }),
);

/** GET /api/products/:slug → single product by slug (product landing page). */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const result = await getProductBySlug(req.params.slug);
    if (!result || !result.product.active) {
      throw new HttpError(404, 'Product not found');
    }
    res.json(result);
  }),
);

export default router;
