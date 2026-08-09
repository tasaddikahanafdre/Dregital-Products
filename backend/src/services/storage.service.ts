import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase';
import { HttpError } from '../middleware/error';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function extensionFor(mime: string): string {
  const ext = ALLOWED_MIME[mime.toLowerCase()];
  if (!ext) {
    throw new HttpError(
      400,
      'Unsupported file type. Upload JPG, PNG, WebP, GIF or AVIF images.',
    );
  }
  return ext;
}

export interface UploadedImage {
  path: string;
  publicUrl: string;
}

/** Upload an in-memory image buffer to Supabase Storage and return its path + public URL. */
export async function uploadImage(
  bucket: string,
  folder: string,
  file: { buffer: Buffer; mimetype: string; size: number },
): Promise<UploadedImage> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new HttpError(400, 'Image is too large. Maximum size is 5MB.');
  }
  const ext = extensionFor(file.mimetype);
  const path = `${folder}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) {
    throw new HttpError(500, `Failed to upload image to storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Delete a stored object. Silently ignores missing files. */
export async function deleteStoredFile(bucket: string, path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.warn(`Failed to delete ${bucket}/${path}:`, error.message);
  }
}
