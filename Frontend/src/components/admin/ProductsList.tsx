import { useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBDT } from '../../lib/format';
import type { Product } from '../../types';
import Spinner from '../ui/Spinner';

interface ProductsListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

export default function ProductsList({ products, onEdit, onRefresh }: ProductsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      await api.delete(`/admin/products/${product.id}`);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-4 py-16 text-center">
        <p className="text-sm font-medium text-neutral-500">No products yet</p>
        <p className="mt-1 text-xs text-neutral-400">
          Create your first product to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-bold text-neutral-900 truncate">
                {product.name}
              </p>
              {!product.active && (
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-500">
                  Draft
                </span>
              )}
              {!product.in_stock && (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                  Out of stock
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
              <span className="font-mono">/p/{product.slug}</span>
              <span>·</span>
              <span className="font-semibold text-neutral-700">{formatBDT(product.price)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`/p/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              title="View product page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => onEdit(product)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
              title="Edit product"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => void handleDelete(product)}
              disabled={deletingId === product.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
              title="Delete product"
            >
              {deletingId === product.id ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
