import { useEffect, useRef, useState } from 'react';
import { Check, Play, Save, UploadCloud } from 'lucide-react';
import { api } from '../../lib/api';
import type { StoreSettings } from '../../types';
import Spinner from '../ui/Spinner';

interface MediaSettingsProps {
  settings: StoreSettings | null;
  loading: boolean;
  onSaved: (settings: StoreSettings) => void;
}

const inputCls =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

export default function MediaSettings({ settings, loading, onSaved }: MediaSettingsProps) {
  const [form, setForm] = useState({
    video_url: '',
    video_type: 'youtube' as 'youtube' | 'facebook',
    delivery_charge_inside_dhaka: '',
    delivery_charge_outside_dhaka: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;
    setForm({
      video_url: settings.video_url ?? '',
      video_type: settings.video_type === 'facebook' ? 'facebook' : 'youtube',
      delivery_charge_inside_dhaka: String(settings.delivery_charge_inside_dhaka),
      delivery_charge_outside_dhaka: String(settings.delivery_charge_outside_dhaka),
    });
  }, [settings]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-neutral-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { settings: updated } = await api.put<{ settings: StoreSettings }>(
        '/admin/settings',
        {
          video_url: form.video_url.trim(),
          video_type: form.video_url.trim() ? form.video_type : 'none',
          delivery_charge_inside_dhaka: Number(form.delivery_charge_inside_dhaka) || 0,
          delivery_charge_outside_dhaka: Number(form.delivery_charge_outside_dhaka) || 0,
        },
      );
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnail = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { settings: updated } = await api.upload<{ settings: StoreSettings }>(
        '/admin/settings/thumbnail',
        formData,
      );
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thumbnail upload failed');
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const thumbnailUrl = settings?.video_thumbnail_url;

  return (
    <div className="space-y-4">
      {/* Video */}
      <form onSubmit={handleSave} className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
        <h2 className="font-display text-base font-bold text-neutral-900">Promo video</h2>
        <p className="mt-1 text-xs text-neutral-400">
          Paste a YouTube or Facebook video link. It shows on the homepage with the thumbnail.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Video link
            </label>
            <input
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['youtube', 'facebook'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, video_type: type }))}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition-all ${
                  form.video_type === type
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                {type === 'youtube' ? 'YouTube' : 'Facebook'}
              </button>
            ))}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Video thumbnail
            </label>
            <div className="flex items-center gap-3">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Video thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                    <Play className="h-6 w-6" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={uploadingThumb}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 px-4 py-6 text-sm font-medium text-neutral-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
              >
                {uploadingThumb ? <Spinner className="h-4 w-4" /> : <UploadCloud className="h-5 w-5" />}
                {uploadingThumb ? 'Uploading…' : thumbnailUrl ? 'Replace' : 'Upload'}
              </button>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleThumbnail(e.target.files)}
              />
            </div>
          </div>
        </div>

        {/* Delivery charges */}
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <h3 className="font-display text-sm font-bold text-neutral-900">Delivery charges (৳)</h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Inside Dhaka
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.delivery_charge_inside_dhaka}
                onChange={(e) =>
                  setForm((f) => ({ ...f, delivery_charge_inside_dhaka: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Outside Dhaka
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.delivery_charge_outside_dhaka}
                onChange={(e) =>
                  setForm((f) => ({ ...f, delivery_charge_outside_dhaka: e.target.value }))
                }
                className={inputCls}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Checkout picks the charge automatically based on the customer's district.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 font-display text-sm font-bold text-white transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Spinner className="h-4 w-4" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save video & delivery'}
        </button>
      </form>
    </div>
  );
}
