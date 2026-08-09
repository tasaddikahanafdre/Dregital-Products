import { Router } from 'express';
import multer from 'multer';
import { supabase, VIDEO_THUMBNAILS_BUCKET } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/auth';
import { asyncHandler, HttpError } from '../../middleware/error';
import { getSettings, updateSettings } from '../../services/settings.service';
import { deleteStoredFile, uploadImage } from '../../services/storage.service';
import { updateSettingsSchema } from '../../validators/schemas';

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAdmin);

/** GET /api/admin/settings → full store settings. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json({ settings });
  }),
);

/** PUT /api/admin/settings → delivery charges + video link. */
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const patch = updateSettingsSchema.parse(req.body);
    const settings = await updateSettings(patch);
    res.json({ settings });
  }),
);

/** POST /api/admin/settings/thumbnail → upload the video thumbnail image. */
router.post(
  '/thumbnail',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No image file received. Use multipart form field "image".');
    }

    const current = await getSettings();
    const { path, publicUrl } = await uploadImage(
      VIDEO_THUMBNAILS_BUCKET,
      'thumbnails',
      req.file,
    );

    const { data: settings, error } = await supabase
      .from('store_settings')
      .update({ video_thumbnail_path: path, video_thumbnail_url: publicUrl })
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      await deleteStoredFile(VIDEO_THUMBNAILS_BUCKET, path);
      throw new HttpError(500, `Failed to save thumbnail: ${error.message}`);
    }

    // Free up storage by removing the old thumbnail.
    if (current.video_thumbnail_path && current.video_thumbnail_path !== path) {
      await deleteStoredFile(VIDEO_THUMBNAILS_BUCKET, current.video_thumbnail_path);
    }

    res.status(201).json({ settings });
  }),
);

export default router;
