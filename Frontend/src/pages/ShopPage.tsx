import { Link } from 'react-router-dom';
import Header from '../components/home/Header';
import Footer from '../components/home/Footer';
import Spinner from '../components/ui/Spinner';
import { useProducts } from '../hooks/useProducts';
import { formatBDT, discountPercent } from '../lib/format';

export default function ShopPage() {
  const { products, loading, error } = useProducts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900">
            Shop
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Browse our products — tap to view details and order.
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
              <Spinner className="h-8 w-8" />
              <p className="mt-3 text-sm">Loading products…</p>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-md py-24 text-center">
              <p className="font-display text-lg font-bold text-neutral-900">Something went wrong</p>
              <p className="mt-2 text-sm text-neutral-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm font-medium text-neutral-500">No products available yet.</p>
              <p className="mt-1 text-xs text-neutral-400">
                Products added from the Admin Dashboard will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const discount = discountPercent(product.price, product.original_price);
                return (
                  <Link
                    key={product.id}
                    to={`/p/${product.slug}`}
                    className="group overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                  >
                    {/* Product image */}
                    <div className="aspect-square w-full bg-neutral-50">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-300">
                          <span className="text-sm">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {product.tagline && (
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          {product.tagline}
                        </p>
                      )}
                      <h2 className="mt-1 font-display text-lg font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">
                        {product.name}
                      </h2>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-display text-xl font-extrabold text-neutral-900">
                          {formatBDT(product.price)}
                        </span>
                        {product.original_price &&
                          Number(product.original_price) > Number(product.price) && (
                            <>
                              <span className="text-sm text-neutral-400 line-through">
                                {formatBDT(product.original_price)}
                              </span>
                              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                {discount}% OFF
                              </span>
                            </>
                          )}
                      </div>

                      {!product.in_stock && (
                        <p className="mt-2 text-xs font-semibold text-neutral-400">Out of stock</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
