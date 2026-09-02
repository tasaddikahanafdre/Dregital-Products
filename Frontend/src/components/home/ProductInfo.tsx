import { useNavigate } from 'react-router-dom';
import { Banknote, ShieldCheck, Truck, Zap } from 'lucide-react';
import type { Product } from '../../types';
import { discountPercent, formatBDT } from '../../lib/format';

interface ProductInfoProps {
  product: Product;
  slug?: string;
}

const TRUST_ITEMS = [
  { icon: Banknote, label: 'Cash on Delivery' },
  { icon: Truck, label: 'Delivery all over BD' },
  { icon: ShieldCheck, label: 'Authentic product' },
];

export default function ProductInfo({ product, slug }: ProductInfoProps) {
  const navigate = useNavigate();
  const discount = discountPercent(product.price, product.original_price);

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          <Zap className="h-3 w-3" />
          Best Seller
        </span>
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
        {product.name}
      </h1>

      {product.tagline && (
        <p className="mt-1.5 text-sm text-neutral-500 md:text-base">{product.tagline}</p>
      )}

      {/* Price row */}
      <div className="mt-4 flex items-center gap-3">
        <span className="font-display text-3xl font-extrabold tracking-tight text-neutral-900">
          {formatBDT(product.price)}
        </span>
        {product.original_price && Number(product.original_price) > Number(product.price) && (
          <>
            <span className="text-lg text-neutral-400 line-through">
              {formatBDT(product.original_price)}
            </span>
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      {product.description && (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">
          {product.description}
        </p>
      )}

      {/* Trust chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600"
          >
            <Icon className="h-3.5 w-3.5 text-brand-500" />
            {label}
          </span>
        ))}
      </div>

      {/* Order CTA */}
      <button
        onClick={() => navigate(slug ? `/checkout/${slug}` : '/')}
        className="group mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 font-display text-base font-bold text-white shadow-lift transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]"
      >
        Order Now
        <span className="font-semibold">{formatBDT(product.price)}</span>
        <span className="text-brand-200 transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </button>
      <p className="mt-2.5 text-center text-xs text-neutral-400">
        Pay only when your order arrives · Inside Dhaka &amp; all over Bangladesh
      </p>
    </section>
  );
}
