import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { formatBDT } from '../../lib/format';

interface StickyOrderBarProps {
  price: number;
  visible: boolean;
}

export default function StickyOrderBar({ price, visible }: StickyOrderBarProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 md:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="safe-bottom border-t border-neutral-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,15,15,0.1)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              Price
            </p>
            <p className="font-display text-lg font-extrabold text-neutral-900">
              {formatBDT(price)}
            </p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 font-display text-sm font-bold text-white shadow-lift transition-all duration-200 hover:bg-brand-700 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
}
