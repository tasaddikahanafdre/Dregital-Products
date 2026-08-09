import { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { api } from '../../lib/api';
import type { Product } from '../../types';
import Spinner from '../ui/Spinner';

interface ProductEditorProps {
  product: Product | null;
  loading: boolean;
  onSaved: (product: Product) => void;
}

export default function ProductEditor({ product, loading, onSaved }: ProductEditorProps) {
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    price: '',
    original_price: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name,
      tagline: product.tagline ?? '',
      description: product.description,
      price: String(product.price),
      original_price: product.original_price != null ? String(product.original_price) : '',
      active: product.active,
    });
  }, [product]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-neutral-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-medium text-neutral-500">Product data unavailable</p>
        <p className="mt-1 text-xs text-neutral-400">Refresh the dashboard to try again.</p>
      </div>
    );
  }

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { product: updated } = await api.put<{ product: Product }>('/admin/product', {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        description: form.description.trim(),
        price: Number(form.price),
        original_price: form.original_price.trim() ? Number(form.original_price) : null,
        active: form.active,
      });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-neutral-900">Product details</h2>
        {saved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        Everything here appears on the homepage — nothing is hardcoded.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Product name
          </label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Pawsum Signature Cap"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Tagline (optional)
          </label>
          <input
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            className={inputCls}
            placeholder="A short, punchy line under the name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            required
            rows={5}
            className={`${inputCls} resize-none`}
            placeholder="Describe the product, features and benefits…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Price (৳)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              required
              className={inputCls}
              placeholder="1290"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Original price (৳, optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.original_price}
              onChange={(e) => set('original_price', e.target.value)}
              className={inputCls}
              placeholder="1790"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-neutral-800">Product available</p>
            <p className="text-xs text-neutral-400">
              When off, customers can't place orders
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.active}
            onClick={() => set('active', !form.active)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              form.active ? 'bg-brand-600' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                form.active ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 font-display text-sm font-bold text-white transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save product
        </button>
      </div>
    </form>
  );
}
