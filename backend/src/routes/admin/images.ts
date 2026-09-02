import { Router } from 'express';
import multer from 'multer';
import { supabase, PRODUCT_IMAGES_BUCKET } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler, HttpError } from '../../middleware/error';
import { getProductById } from '../../services/product.service';
import { deleteStoredFile, uploadImage } from '../../services/storage.service';
import { reorderImagesSchema } from '../../validators/schemas';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAdmin);

/** POST /api/admin/products/:id/images → upload one image for a specific product. */
router.post(
  '/:id/images',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No image file received. Use multipart form field "image".');
    }

    const productId = req.params.id;

    // Verify the product exists
    const result = await getProductById(productId);
    if (!result) {
      throw new HttpError(404, 'Product not found');
    }

    // Find next sort order for this product
    const { data: images, error: listError } = await supabase
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1);
    if (listError) throw listError;

    const nextSortOrder =
      ((images?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;

    const { path, publicUrl } = await uploadImage(PRODUCT_IMAGES_BUCKET, 'products', req.file);

    const { data: image, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: path,
        public_url: publicUrl,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      await deleteStoredFile(PRODUCT_IMAGES_BUCKET, path);
      throw new HttpError(500, `Failed to save image: ${error.message}`);
    }

    res.status(201).json({ image });
  }),
);

/** DELETE /api/admin/products/:id/images/:imageId → remove an image. */
router.delete(
  '/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    const { data: image, error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', req.params.imageId)
      .eq('product_id', req.params.id)
      .select()
      .single();

    if (error) throw new HttpError(404, 'Image not found');
    await deleteStoredFile(PRODUCT_IMAGES_BUCKET, (image as { storage_path: string }).storage_path);
    res.json({ ok: true });
  }),
);

/** PUT /api/admin/products/:id/images/reorder → set display order. */
router.put(
  '/:id/images/reorder',
  asyncHandler(async (req, res) => {
    const { imageIds } = reorderImagesSchema.parse(req.body);

    for (let i = 0; i < imageIds.length; i += 1) {
      const { error } = await supabase
        .from('product_images')
        .update({ sort_order: i })
        .eq('id', imageIds[i])
        .eq('product_id', req.params.id);
      if (error) {
        throw new HttpError(500, `Failed to reorder images: ${error.message}`);
      }
    }

    res.json({ ok: true });
  }),
);

export default router;
