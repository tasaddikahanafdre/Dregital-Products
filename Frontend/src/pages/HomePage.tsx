import { useEffect, useRef, useState } from 'react';
import Header from '../components/home/Header';
import Gallery from '../components/home/Gallery';
import ProductInfo from '../components/home/ProductInfo';
import VideoSection from '../components/home/VideoSection';
import StickyOrderBar from '../components/home/StickyOrderBar';
import Footer from '../components/home/Footer';
import Spinner from '../components/ui/Spinner';
import { useProduct } from '../hooks/useProduct';
import { useSettings } from '../hooks/useSettings';

export default function HomePage() {
  const { product, images, loading, error } = useProduct();
  const { settings } = useSettings();

  // Show the sticky bar only after the user scrolls past the main CTA.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
            <Spinner className="h-8 w-8" />
            <p className="mt-3 text-sm">Loading store…</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md px-4 py-24 text-center">
            <p className="font-display text-lg font-bold text-neutral-900">Something went wrong</p>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Try again
            </button>
          </div>
        ) : product ? (
          <div className="animate-fade-in">
            <Gallery images={images} productName={product.name} />

            <div ref={ctaRef}>
              <ProductInfo product={product} />
            </div>

            <VideoSection video={settings.video} />
          </div>
        ) : null}
      </main>

      <Footer />

      {product && (
        <StickyOrderBar price={Number(product.price)} visible={showSticky} />
      )}
    </div>
  );
}
