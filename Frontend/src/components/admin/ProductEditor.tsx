import { useEffect, useState } from 'react';
import { Check, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { Product, ProductVariant, ProductSpec } from '../../types';
import Spinner from '../ui/Spinner';

interface ProductEditorProps {
  product: Product | null;
  loading: boolean;
  onSaved: (product: Product) => void;
  onDeleted?: (productId: string) => void;
}

interface FormState {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  original_price: string;
  active: boolean;
  in_stock: boolean;
  seo_title: string;
  seo_description: string;
  features: string[];
  variants: ProductVariant[];
  specifications: ProductSpec[];
  video_url: string;
  video_type: 'youtube' | 'facebook' | 'none';
  video_thumbnail_url: string;
}

const EMPTY_FORM: FormState = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  price: '',
  original_price: '',
  active: true,
  in_stock: true,
  seo_title: '',
  seo_description: '',
  features: [],
  variants: [],
  specifications: [],
  video_url: '',
  video_type: 'none',
  video_thumbnail_url: '',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductEditor({ product, loading, onSaved, onDeleted }: ProductEditorProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const isEditing = !!product;

  useEffect(() => {
    if (!product) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      slug: product.slug,
      name: product.name,
      tagline: product.tagline ?? '',
      description: product.description,
      price: String(product.price),
      original_price: product.original_price != null ? String(product.original_price) : '',
      active: product.active,
      in_stock: product.in_stock ?? true,
      seo_title: product.seo_title ?? '',
      seo_description: product.seo_description ?? '',
      features: product.features ?? [],
      variants: product.variants ?? [],
      specifications: product.specifications ?? [],
      video_url: product.video_url ?? '',
      video_type: product.video_type ?? 'none',
      video_thumbnail_url: product.video_thumbnail_url ?? '',
    });
  }, [product]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-neutral-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const set = (field: keyof FormState, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    // Auto-generate slug only when creating (slug is empty or matches old auto-slug)
    if (!isEditing || form.slug === slugify(form.name)) {
      set('slug', slugify(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      description: form.description.trim(),
      price: Number(form.price),
      original_price: form.original_price.trim() ? Number(form.original_price) : null,
      active: form.active,
      in_stock: form.in_stock,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      features: form.features,
      variants: form.variants,
      specifications: form.specifications,
      video_url: form.video_url.trim() || null,
      video_type: form.video_type,
      video_thumbnail_url: form.video_thumbnail_url.trim() || null,
    };

    try {
      let result: { product: Product };
      if (isEditing) {
        result = await api.put<{ product: Product }>(`/admin/products/${product.id}`, payload);
      } else {
        result = await api.post<{ product: Product }>('/admin/products', payload);
      }
      onSaved(result.product);
      setSaved(true);
      setJustCreated(!isEditing);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !onDeleted) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${product.id}`);
      onDeleted(product.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product');
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    set('features', [...form.features, newFeature.trim()]);
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    set('features', form.features.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    set('variants', [...form.variants, { name: '', options: [''] }]);
  };

  const updateVariant = (index: number, patch: Partial<ProductVariant>) => {
    const updated = [...form.variants];
    updated[index] = { ...updated[index], ...patch };
    set('variants', updated);
  };

  const removeVariant = (index: number) => {
    set('variants', form.variants.filter((_, i) => i !== index));
  };

  const addVariantOption = (variantIndex: number) => {
    const updated = [...form.variants];
    updated[variantIndex] = {
      ...updated[variantIndex],
      options: [...updated[variantIndex].options, ''],
    };
    set('variants', updated);
  };

  const updateVariantOption = (variantIndex: number, optionIndex: number, value: string) => {
    const updated = [...form.variants];
    const options = [...updated[variantIndex].options];
    options[optionIndex] = value;
    updated[variantIndex] = { ...updated[variantIndex], options };
    set('variants', updated);
  };

  const removeVariantOption = (variantIndex: number, optionIndex: number) => {
    const updated = [...form.variants];
    const options = updated[variantIndex].options.filter((_, i) => i !== optionIndex);
    updated[variantIndex] = { ...updated[variantIndex], options };
    set('variants', updated);
  };

  const addSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
    set('specifications', [...form.specifications, { label: newSpecLabel.trim(), value: newSpecValue.trim() }]);
    setNewSpecLabel('');
    setNewSpecValue('');
  };

  const removeSpec = (index: number) => {
    set('specifications', form.specifications.filter((_, i) => i !== index));
  };

  const inputCls =
    'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-neutral-900">
          {isEditing ? 'Edit product' : 'New product'}
        </h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <Check className="h-3.5 w-3.5" /> {justCreated ? 'Created! Add images below ↓' : 'Saved'}
            </span>
          )}
          {isEditing && onDeleted && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:border-red-300 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        {isEditing
          ? 'Edit the product details below. Changes are live immediately.'
          : 'Fill in the details below. A unique URL slug will be generated automatically.'}
      </p>

      <div className="mt-5 space-y-5">
        {/* Name + Slug */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Product name *
            </label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className={inputCls}
              placeholder="e.g. E88 MAX Drone"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              URL slug *
            </label>
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              required
              className={inputCls}
              placeholder="e88-max-drone"
            />
            {form.slug && (
              <p className="mt-1 text-[11px] text-neutral-400">
                /p/{form.slug}
              </p>
            )}
          </div>
        </div>

        {/* Tagline */}
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

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Description *
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

        {/* Price row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Price (৳) *
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

        {/* Active + In Stock toggles */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-neutral-800">Published</p>
              <p className="text-xs text-neutral-400">Visible on the shop</p>
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
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-neutral-800">In stock</p>
              <p className="text-xs text-neutral-400">Available to order</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.in_stock}
              onClick={() => set('in_stock', !form.in_stock)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                form.in_stock ? 'bg-brand-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  form.in_stock ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Features */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Features
          </label>
          <div className="space-y-2">
            {form.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span className="flex-1 text-sm text-neutral-700">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                className={`${inputCls} flex-1`}
                placeholder="Add a feature…"
              />
              <button
                type="button"
                onClick={addFeature}
                className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Specifications
          </label>
          <div className="space-y-2">
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1/3 text-neutral-500">{spec.label}</span>
                <span className="flex-1 text-neutral-700">{spec.value}</span>
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newSpecLabel}
                onChange={(e) => setNewSpecLabel(e.target.value)}
                className={`${inputCls} w-1/3`}
                placeholder="Label"
              />
              <input
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpec();
                  }
                }}
                className={`${inputCls} flex-1`}
                placeholder="Value"
              />
              <button
                type="button"
                onClick={addSpec}
                className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Variants / Options
          </label>
          <div className="space-y-3">
            {form.variants.map((variant, vi) => (
              <div key={vi} className="rounded-2xl border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={variant.name}
                    onChange={(e) => updateVariant(vi, { name: e.target.value })}
                    className={`${inputCls} flex-1`}
                    placeholder="Variant name (e.g. Color, Size)"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(vi)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {variant.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1">
                      <input
                        value={opt}
                        onChange={(e) => updateVariantOption(vi, oi, e.target.value)}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-brand-400"
                        placeholder="Option"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantOption(vi, oi)}
                        className="text-neutral-300 hover:text-neutral-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addVariantOption(vi)}
                    className="rounded-lg border border-dashed border-neutral-200 px-2 py-1 text-[10px] font-semibold text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 rounded-xl border border-dashed border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add variant
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Promo Video
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Add a YouTube or Facebook video link for this product.
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Video URL</label>
              <input
                value={form.video_url}
                onChange={(e) => set('video_url', e.target.value)}
                className={inputCls}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['youtube', 'facebook', 'none'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('video_type', type)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold capitalize transition-all ${
                    form.video_type === type
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                  }`}
                >
                  {type === 'none' ? 'No video' : type === 'youtube' ? 'YouTube' : 'Facebook'}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Thumbnail URL (optional)</label>
              <input
                value={form.video_thumbnail_url}
                onChange={(e) => set('video_thumbnail_url', e.target.value)}
                className={inputCls}
                placeholder="https://… (auto-detected from YouTube if left empty)"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-2xl border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">SEO</p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">SEO Title</label>
              <input
                value={form.seo_title}
                onChange={(e) => set('seo_title', e.target.value)}
                className={inputCls}
                placeholder="Custom title for search engines"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">SEO Description</label>
              <textarea
                value={form.seo_description}
                onChange={(e) => set('seo_description', e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Custom meta description for search engines"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 font-display text-sm font-bold text-white transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isEditing ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
