import { Router } from 'express';
import { asyncHandler, HttpError } from '../../middleware/error';
import { getProductWithImages } from '../../services/product.service';

const router = Router();

/** GET /api/product → the single product + its images. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { product, images } = await getProductWithImages();
    if (!product || !product.active) {
      throw new HttpError(404, 'Product not available right now.');
    }
    res.json({ product, images });
  }),
);

export default router;
