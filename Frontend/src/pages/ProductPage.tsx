import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/home/Header';
import Gallery from '../components/home/Gallery';
import ProductInfo from '../components/home/ProductInfo';
import VideoSection from '../components/home/VideoSection';
import StickyOrderBar from '../components/home/StickyOrderBar';
import Footer from '../components/home/Footer';
import Spinner from '../components/ui/Spinner';
import { useProductBySlug } from '../hooks/useProductBySlug';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, images, loading, error } = useProductBySlug(slug);

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

  // Update page title and meta tags for SEO
  useEffect(() => {
    if (!product) return;
    const title = product.seo_title || product.name;
    document.title = `${title} | Dregital`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', product.seo_description || product.description.slice(0, 160));
    }
  }, [product]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
            <Spinner className="h-8 w-8" />
            <p className="mt-3 text-sm">Loading product…</p>
          </div>
        ) : error || !product ? (
          <div className="mx-auto max-w-md px-4 py-24 text-center">
            <p className="font-display text-lg font-bold text-neutral-900">Product not found</p>
            <p className="mt-2 text-sm text-neutral-500">
              {error ?? "This product doesn't exist or is no longer available."}
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Back to shop
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in">
            <Gallery images={images} productName={product.name} />

            <div ref={ctaRef}>
              <ProductInfo product={product} slug={product.slug} />
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <section className="mx-auto max-w-5xl px-4 py-6">
                <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">
                  Features
                </h2>
                <ul className="mt-4 space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <section className="mx-auto max-w-5xl px-4 py-6">
                <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">
                  Specifications
                </h2>
                <div className="mt-4 rounded-3xl border border-neutral-100 bg-white p-4 shadow-soft">
                  <dl className="divide-y divide-neutral-100">
                    {product.specifications.map((spec, i) => (
                      <div key={i} className="flex justify-between py-3 text-sm">
                        <dt className="font-medium text-neutral-500">{spec.label}</dt>
                        <dd className="font-semibold text-neutral-900">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            )}

            <VideoSection video={
              product.video_url
                ? {
                    url: product.video_url,
                    type: (product.video_type ?? 'youtube') as 'youtube' | 'facebook',
                    thumbnailUrl: product.video_thumbnail_url ?? null,
                  }
                : undefined
            } />
          </div>
        )}
      </main>

      <Footer />

      {product && (
        <StickyOrderBar price={Number(product.price)} visible={showSticky} slug={product.slug} />
      )}
    </div>
  );
}
