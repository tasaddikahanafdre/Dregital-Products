import { useEffect, useState } from 'react';
import { Check, MapPin, Save } from 'lucide-react';
import { api } from '../../lib/api';
import type { StoreSettings } from '../../types';
import Spinner from '../ui/Spinner';

interface DeliverySettingsProps {
  settings: StoreSettings | null;
  loading: boolean;
  onSaved: (settings: StoreSettings) => void;
}

const inputCls =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

const SUBAREA_DISTRICTS = ['Gazipur', 'Narayanganj', 'Tangail', 'Narsingdi', 'Munshiganj'];

export default function DeliverySettings({ settings, loading, onSaved }: DeliverySettingsProps) {
  const [form, setForm] = useState({
    delivery_charge_inside_dhaka: '',
    delivery_charge_dhaka_subarea: '',
    delivery_charge_outside_dhaka: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setForm({
      delivery_charge_inside_dhaka: String(settings.delivery_charge_inside_dhaka),
      delivery_charge_dhaka_subarea: String(settings.delivery_charge_dhaka_subarea ?? 80),
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
          delivery_charge_inside_dhaka: Number(form.delivery_charge_inside_dhaka) || 0,
          delivery_charge_outside_dhaka: Number(form.delivery_charge_outside_dhaka) || 0,
          delivery_charge_dhaka_subarea: Number(form.delivery_charge_dhaka_subarea) || 0,
        },
      );
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save delivery settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="rounded-3xl border border-neutral-100 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-neutral-900">Delivery Charges</h2>
            <p className="text-xs text-neutral-400">
              Set shipping fees for each delivery zone
            </p>
          </div>
        </div>

        {/* Three delivery zones */}
        <div className="mt-6 space-y-4">
          {/* Inside Dhaka */}
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-bold text-neutral-900">Inside Dhaka</p>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Dhaka city areas — fastest delivery
            </p>
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Charge (৳)
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
                placeholder="60"
              />
            </div>
          </div>

          {/* Dhaka Subarea */}
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <p className="text-sm font-bold text-neutral-900">Dhaka Subarea</p>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {SUBAREA_DISTRICTS.join(', ')}
            </p>
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Charge (৳)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.delivery_charge_dhaka_subarea}
                onChange={(e) =>
                  setForm((f) => ({ ...f, delivery_charge_dhaka_subarea: e.target.value }))
                }
                className={inputCls}
                placeholder="80"
              />
            </div>
          </div>

          {/* Outside Dhaka */}
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <p className="text-sm font-bold text-neutral-900">Outside Dhaka</p>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              All other districts across Bangladesh
            </p>
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Charge (৳)
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
                placeholder="120"
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-400">
          The checkout automatically picks the correct charge based on the customer's selected district.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 font-display text-sm font-bold text-white transition-all hover:bg-neutral-700 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Spinner className="h-4 w-4" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save delivery charges'}
        </button>
      </form>
    </div>
  );
}
