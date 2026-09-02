import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { api } from '../../lib/api';
import type { ProductImage } from '../../types';
import Spinner from '../ui/Spinner';

interface ImagesManagerProps {
  productId: string;
  images: ProductImage[];
  onChanged: (images: ProductImage[]) => void;
}

export default function ImagesManager({ productId, images, onChanged }: ImagesManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const notify = (text: string | null) => setMessage(text);
  const flashError = (text: string) => {
    setError(text);
    setTimeout(() => setError(null), 4000);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: ProductImage[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('image', file);
        const { image } = await api.upload<{ image: ProductImage }>(
          `/admin/products/${productId}/images`,
          form,
        );
        uploaded.push(image);
      }
      onChanged([...images, ...uploaded]);
      notify(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
      setTimeout(() => notify(null), 2500);
    } catch (e) {
      flashError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (image: ProductImage) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/admin/products/${productId}/images/${image.id}`);
      onChanged(images.filter((i) => i.id !== image.id));
      notify('Image deleted');
      setTimeout(() => notify(null), 2500);
    } catch (e) {
      flashError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setReordering(true);
    try {
      await api.put(`/admin/products/${productId}/images/reorder`, {
        imageIds: next.map((i) => i.id),
      });
      onChanged(next);
    } catch (e) {
      flashError(e instanceof Error ? e.message : 'Reorder failed');
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-neutral-900">Product images</h2>
      <p className="mt-1 text-xs text-neutral-400">
        First image = main gallery image. Drag order with the arrows.
      </p>

      {error && (
        <p className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}

      {/* Upload zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Spinner className="h-6 w-6 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">Uploading…</span>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-brand-700">Upload images</span>
            <span className="text-xs text-neutral-400">
              JPG, PNG, WebP, GIF or AVIF · max 5MB each
            </span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Image list */}
      {images.length > 0 && (
        <ul className="mt-4 space-y-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-2.5"
            >
              <img
                src={image.public_url}
                alt={`Product image ${index + 1}`}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-800">
                  Image {index + 1}
                  {index === 0 && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                      Main
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-neutral-400">{image.storage_path}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reordering}
                  aria-label="Move up"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1 || reordering}
                  aria-label="Move down"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(image)}
                  aria-label="Delete image"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 && !uploading && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-6 text-neutral-400">
          <ImagePlus className="h-5 w-5" />
          <p className="text-sm">No images yet — upload your first product photo.</p>
        </div>
      )}
    </div>
  );
}
