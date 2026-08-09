import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { getProductWithImages, updateProduct } from '../../services/product.service';
import { updateProductSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAdmin);

/** GET /api/admin/product → full product + images for editing. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { product, images } = await getProductWithImages();
    res.json({ product, images });
  }),
);

/** PUT /api/admin/product → update name, description, price, etc. */
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const patch = updateProductSchema.parse(req.body);
    const product = await updateProduct(patch);
    res.json({ product });
  }),
);

export default router;
