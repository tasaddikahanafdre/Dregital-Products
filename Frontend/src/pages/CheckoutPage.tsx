import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Minus, Plus, ShieldCheck } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { api, ApiError } from '../lib/api';
import { DISTRICTS } from '../lib/districts';
import { formatBDT } from '../lib/format';
import { useProduct } from '../hooks/useProduct';
import { useSettings } from '../hooks/useSettings';
import type { Order } from '../types';

interface FormState {
  customerName: string;
  phone: string;
  district: string;
  deliveryArea: string;
  address: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  customerName: '',
  phone: '',
  district: '',
  deliveryArea: '',
  address: '',
  notes: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.customerName.trim().length < 2) errors.customerName = 'Please enter your full name';
  if (!/^[0-9+\-\s()]{8,20}$/.test(form.phone.trim()))
    errors.phone = 'Enter a valid phone number (e.g. 01XXXXXXXXX)';
  if (!form.district) errors.district = 'Select your district';
  if (form.deliveryArea.trim().length < 2) errors.deliveryArea = 'Enter your delivery area';
  if (form.address.trim().length < 5) errors.address = 'Enter your full address';
  return errors;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { product, images, loading, error } = useProduct();
  const { settings, loading: settingsLoading } = useSettings();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const district = form.district;
  const isInsideDhaka = district.toLowerCase() === 'dhaka';

  const deliveryCharge = useMemo(() => {
    if (!district) return null;
    return isInsideDhaka ? settings.deliveryChargeInsideDhaka : settings.deliveryChargeOutsideDhaka;
  }, [district, isInsideDhaka, settings]);

  const subtotal = product ? Number(product.price) * quantity : 0;
  const total = subtotal + (deliveryCharge ?? 0);

  const setField = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order } = await api.post<{ order: Order }>('/orders', {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        district: form.district,
        deliveryArea: form.deliveryArea.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || undefined,
        quantity,
        paymentMethod: 'cod',
      });
      navigate(`/order/${order.order_number}`, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to place order. Try again.');
      setSubmitting(false);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-neutral-400">
        <Spinner className="h-8 w-8" />
        <p className="mt-3 text-sm">Loading checkout…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-lg font-bold text-neutral-900">Checkout unavailable</p>
        <p className="mt-2 text-sm text-neutral-500">{error ?? 'Product not found'}</p>
        <Link to="/" className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white">
          Back to home
        </Link>
      </div>
    );
  }

  const mainImage = images[0]?.public_url;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-neutral-900">Checkout</p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} noValidate>
          {/* Order summary card */}
          <section className="rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
                  No image
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-neutral-900">
                  {product.name}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{formatBDT(product.price)}</p>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between text-neutral-500">
                <dt>
                  Subtotal × {quantity}
                </dt>
                <dd>{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-neutral-500">
                <dt>
                  Delivery
                  <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                    {deliveryCharge !== null
                      ? isInsideDhaka
                        ? 'Inside Dhaka'
                        : 'Outside Dhaka'
                      : '—'}
                  </span>
                </dt>
                <dd>{deliveryCharge !== null ? formatBDT(deliveryCharge) : 'Select district'}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2.5 text-base font-bold text-neutral-900">
                <dt>Total</dt>
                <dd className="font-display">{formatBDT(total)}</dd>
              </div>
            </dl>
          </section>

          {/* Delivery details */}
          <section className="mt-5 rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
              Delivery details
            </h2>

            <div className="mt-4 space-y-4">
              <Field label="Full name" error={errors.customerName}>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setField('customerName', e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className={inputClass(!!errors.customerName)}
                />
              </Field>

              <Field label="Phone number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputClass(!!errors.phone)}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="District" error={errors.district}>
                  <div className="relative">
                    <select
                      value={form.district}
                      onChange={(e) => setField('district', e.target.value)}
                      className={`${inputClass(!!errors.district)} appearance-none pr-10`}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  </div>
                </Field>

                <Field label="Delivery area" error={errors.deliveryArea}>
                  <input
                    type="text"
                    value={form.deliveryArea}
                    onChange={(e) => setField('deliveryArea', e.target.value)}
                    placeholder="e.g. Dhanmondi, Mirpur…"
                    className={inputClass(!!errors.deliveryArea)}
                  />
                </Field>
              </div>

              <Field label="Full address" error={errors.address}>
                <textarea
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="House, road, block, area…"
                  rows={3}
                  className={`${inputClass(!!errors.address)} resize-none`}
                />
              </Field>

              <Field label="Notes (optional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Anything we should know about your delivery?"
                  rows={2}
                  className={`${inputClass(false)} resize-none`}
                />
              </Field>
            </div>
          </section>

          {/* Payment */}
          <section className="mt-5 rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-neutral-900">Cash on Delivery</p>
                <p className="text-xs text-neutral-500">Pay when your order arrives</p>
              </div>
            </div>
          </section>

          {submitError && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 font-display text-base font-bold text-white shadow-lift transition-all duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="h-5 w-5" />
                Placing order…
              </>
            ) : (
              <>Place Order · {formatBDT(total)}</>
            )}
          </button>
          <p className="mt-3 pb-4 text-center text-xs text-neutral-400">
            By placing this order you agree to be contacted at the number provided.
          </p>
        </form>
      </main>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none transition-all focus:ring-4 ${
    hasError
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
      : 'border-neutral-200 focus:border-brand-400 focus:ring-brand-100'
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}
