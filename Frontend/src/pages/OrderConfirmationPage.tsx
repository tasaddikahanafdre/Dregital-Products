import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Home } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { api, ApiError } from '../lib/api';
import { formatBDT, formatDate } from '../lib/format';
import type { Order } from '../types';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!orderNumber) return;

    api
      .get<{ order: Order }>(`/orders/${encodeURIComponent(orderNumber)}`)
      .then(({ order: data }) => active && setOrder(data))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : 'Order not found'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [orderNumber]);

  const copyOrderNumber = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-neutral-400">
        <Spinner className="h-8 w-8" />
        <p className="mt-3 text-sm">Finding your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-lg font-bold text-neutral-900">Order not found</p>
        <p className="mt-2 text-sm text-neutral-500">{error ?? 'We could not find this order.'}</p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="animate-scale-in text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-11 w-11 text-emerald-500" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Order placed!
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Thank you{order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}. We've
            received your order and will call you shortly to confirm.
          </p>
        </div>

        {/* Order number */}
        <div className="mt-8 rounded-3xl border border-dashed border-brand-300 bg-brand-50/60 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Your order number
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="font-display text-2xl font-extrabold tracking-wide text-brand-700">
              {order.order_number}
            </p>
            <button
              onClick={copyOrderNumber}
              aria-label="Copy order number"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-500 transition-colors hover:bg-brand-100"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-brand-600/70">
            Please keep this number for reference
          </p>
        </div>

        {/* Order summary */}
        <section className="mt-6 rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
            Order summary
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-neutral-900">{order.product_name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">Quantity × {order.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-neutral-700">
              {formatBDT(Number(order.product_price) * order.quantity)}
            </p>
          </div>

          <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-600">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatBDT(Number(order.product_price) * order.quantity)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                Delivery
                <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                  {order.district.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                </span>
              </dt>
              <dd>{formatBDT(order.delivery_charge)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-2.5 text-base font-bold text-neutral-900">
              <dt>Total</dt>
              <dd className="font-display">{formatBDT(order.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Payment</dt>
              <dd className="capitalize">Cash on Delivery</dd>
            </div>
          </dl>
        </section>

        {/* Delivery details */}
        <section className="mt-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
            Delivering to
          </h2>
          <div className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <p className="font-semibold">
              {order.customer_name} · {order.phone}
            </p>
            <p>{order.address}</p>
            <p>
              {order.delivery_area}, {order.district}
            </p>
            {order.notes && <p className="text-neutral-500">Note: {order.notes}</p>}
            <p className="pt-1 text-xs text-neutral-400">Placed on {formatDate(order.created_at)}</p>
          </div>
        </section>

        <div className="mt-8 pb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
