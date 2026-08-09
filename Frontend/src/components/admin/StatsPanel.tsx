import { useCallback, useEffect, useState } from 'react';
import { Banknote, CheckCircle2, Package, Timer, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBDT } from '../../lib/format';
import type { AdminStats } from '../../types';
import Spinner from '../ui/Spinner';

const CARD_BASE =
  'rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft transition-transform duration-200 hover:-translate-y-0.5';

export default function StatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { stats: data } = await api.get<{ stats: AdminStats }>('/admin/orders/stats');
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-16 text-neutral-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const cards = [
    { label: 'Total orders', value: stats.totalOrders, icon: Package, tone: 'text-neutral-900 bg-neutral-100' },
    { label: 'Pending', value: stats.pendingOrders, icon: Timer, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, tone: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-4">
      {/* Revenue highlight */}
      <div className="rounded-3xl bg-neutral-900 p-5 text-white shadow-lift">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
            <Banknote className="h-6 w-6 text-brand-400" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Total revenue
            </p>
            <p className="font-display text-2xl font-extrabold">
              {formatBDT(stats.totalRevenue)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Excludes cancelled orders · updated live
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={CARD_BASE}>
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-xl font-extrabold text-neutral-900">{value}</p>
            <p className="text-xs font-medium text-neutral-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
