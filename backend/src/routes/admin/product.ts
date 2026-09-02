import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler, HttpError } from '../../middleware/error';
import {
  listAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/product.service';
import { createProductSchema, updateProductSchema } from '../../validators/schemas';

const router = Router();

router.use(requireAdmin);

/** GET /api/admin/products → list all products. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const products = await listAllProducts();
    res.json({ products });
  }),
);

/** GET /api/admin/products/:id → single product + images for editing. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await getProductById(req.params.id);
    if (!result) {
      throw new HttpError(404, 'Product not found');
    }
    res.json(result);
  }),
);

/** POST /api/admin/products → create a new product. */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    const product = await createProduct(data);
    res.status(201).json({ product });
  }),
);

/** PUT /api/admin/products/:id → update a product. */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const patch = updateProductSchema.parse(req.body);
    const product = await updateProduct(req.params.id, patch);
    res.json({ product });
  }),
);

/** DELETE /api/admin/products/:id → delete a product. */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteProduct(req.params.id);
    res.json({ ok: true });
  }),
);

export default router;
