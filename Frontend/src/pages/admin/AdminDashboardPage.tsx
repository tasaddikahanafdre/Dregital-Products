import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, Package, Plus, ShoppingCart, Truck } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Spinner from '../../components/ui/Spinner';
import StatsPanel from '../../components/admin/StatsPanel';
import ProductsList from '../../components/admin/ProductsList';
import ProductEditor from '../../components/admin/ProductEditor';
import ImagesManager from '../../components/admin/ImagesManager';
import DeliverySettings from '../../components/admin/DeliverySettings';
import OrdersPanel from '../../components/admin/OrdersPanel';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { Product, ProductImage, StoreSettings } from '../../types';

type Tab = 'overview' | 'products' | 'product-edit' | 'delivery' | 'orders';

const TABS: Array<{ id: Tab; label: string; icon: typeof Package }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
];

export default function AdminDashboardPage() {
  const { status, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingImages, setEditingImages] = useState<ProductImage[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [productsData, settingsData] = await Promise.all([
        api.get<{ products: Product[] }>('/admin/products'),
        api.get<{ settings: StoreSettings }>('/admin/settings'),
      ]);
      setProducts(productsData.products);
      setSettings(settingsData.settings);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authed') void loadAll();
  }, [status, loadAll]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-400">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleEditProduct = async (product: Product) => {
    setTab('product-edit');
    try {
      const data = await api.get<{ product: Product; images: ProductImage[] }>(
        `/admin/products/${product.id}`,
      );
      setEditingProduct(data.product);
      setEditingImages(data.images);
    } catch {
      setEditingProduct(product);
      setEditingImages([]);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setEditingImages([]);
    setTab('product-edit');
  };

  const handleProductSaved = async (product: Product) => {
    setEditingProduct(product);
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });
    // Fetch images for the newly created/updated product
    try {
      const data = await api.get<{ product: Product; images: ProductImage[] }>(
        `/admin/products/${product.id}`,
      );
      setEditingImages(data.images);
    } catch {
      // ignore — images may be empty for new products
    }
  };

  const handleProductDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setEditingProduct(null);
    setEditingImages([]);
    setTab('products');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-8">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7" />
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 sm:block"
            >
              View store ↗
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        {loadError && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700">
            <span>{loadError}</span>
            <button onClick={() => void loadAll()} className="font-bold underline underline-offset-2">
              Retry
            </button>
          </div>
        )}

        {loading && !products.length ? (
          <div className="flex justify-center py-24 text-neutral-400">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="animate-fade-in">
            {tab === 'overview' && <StatsPanel />}
            {tab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-neutral-900">
                    Products ({products.length})
                  </h2>
                  <button
                    onClick={handleCreateProduct}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Product
                  </button>
                </div>
                <ProductsList
                  products={products}
                  onEdit={handleEditProduct}
                  onRefresh={loadAll}
                />
              </div>
            )}
            {tab === 'product-edit' && (
              <div className="space-y-4">
                <button
                  onClick={() => setTab('products')}
                  className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  ← Back to products
                </button>
                <ProductEditor
                  product={editingProduct}
                  loading={loading}
                  onSaved={handleProductSaved}
                  onDeleted={handleProductDeleted}
                />
                {editingProduct && (
                  <ImagesManager
                    productId={editingProduct.id}
                    images={editingImages}
                    onChanged={setEditingImages}
                  />
                )}
              </div>
            )}
            {tab === 'delivery' && (
              <DeliverySettings
                settings={settings}
                loading={loading}
                onSaved={setSettings}
              />
            )}
            {tab === 'orders' && <OrdersPanel />}
          </div>
        )}
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md md:hidden">
        <div className="safe-bottom mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                tab === id ? 'text-brand-600' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop tabs */}
      <div className="mx-auto mt-6 hidden max-w-3xl px-4 md:block">
        <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === id ? 'bg-white text-neutral-900 shadow-soft' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
