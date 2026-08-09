import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Phone, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBDT, formatDate } from '../../lib/format';
import { ORDER_STATUSES, STATUS_META } from '../../types';
import type { Order, OrderStatus } from '../../types';
import Spinner from '../ui/Spinner';

const FILTERS: Array<OrderStatus | 'all'> = ['all', ...ORDER_STATUSES];

export default function OrdersPanel() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ orders: Order[]; total: number }>(
        `/admin/orders?status=${filter}&page=1&pageSize=50`,
      );
      setOrders(data.orders);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      const { order: updated } = await api.patch<{ order: Order }>(
        `/admin/orders/${order.id}/status`,
        { status },
      );
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-neutral-900">Orders</h2>
          <p className="text-xs text-neutral-400">{total} order{total === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
              filter === f
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f as OrderStatus].label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400">
          <Spinner className="h-6 w-6" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-4 py-16 text-center">
          <p className="text-sm font-medium text-neutral-500">No orders yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Orders placed on the homepage will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const meta = STATUS_META[order.status];
            const isOpen = expanded === order.id;
            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-soft"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-neutral-900">
                        {order.order_number}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${meta.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-neutral-600">
                      {order.customer_name} · {order.phone}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {order.delivery_area}, {order.district} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-extrabold text-neutral-900">
                      {formatBDT(order.total)}
                    </p>
                    <ChevronDown
                      className={`ml-auto mt-1 h-4 w-4 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 animate-fade-in">
                    {/* Customer info */}
                    <div className="rounded-2xl bg-white p-4 text-sm shadow-soft">
                      <div className="flex items-center gap-1.5 text-neutral-900">
                        <Phone className="h-3.5 w-3.5 text-brand-500" />
                        <a href={`tel:${order.phone}`} className="font-semibold hover:underline">
                          {order.phone}
                        </a>
                      </div>
                      <p className="mt-2 text-neutral-700">
                        {order.address}, {order.delivery_area}, {order.district}
                      </p>
                      {order.notes && (
                        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Items */}
                    <div className="mt-3 rounded-2xl bg-white p-4 text-sm shadow-soft">
                      <div className="flex justify-between">
                        <p className="font-semibold text-neutral-900">{order.product_name}</p>
                        <p className="text-neutral-500">× {order.quantity}</p>
                      </div>
                      <dl className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                        <div className="flex justify-between">
                          <dt>Subtotal</dt>
                          <dd>{formatBDT(Number(order.product_price) * order.quantity)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>
                            Delivery
                            <span className="ml-1 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px]">
                              {order.district.toLowerCase() === 'dhaka' ? 'Inside' : 'Outside'}
                            </span>
                          </dt>
                          <dd>{formatBDT(order.delivery_charge)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-neutral-100 pt-2 text-sm font-bold text-neutral-900">
                          <dt>Total</dt>
                          <dd>{formatBDT(order.total)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Payment</dt>
                          <dd className="uppercase">{order.payment_method}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Status changer */}
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Change status
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ORDER_STATUSES.map((status) => {
                          const active = order.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => changeStatus(order, status)}
                              disabled={updatingId === order.id}
                              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50 ${
                                active
                                  ? 'bg-neutral-900 text-white'
                                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              {STATUS_META[status].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
