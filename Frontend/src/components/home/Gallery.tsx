import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductImage } from '../../types';

interface GalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function Gallery({ images, productName }: GalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-neutral-50 text-center">
        <div>
          <p className="text-sm font-medium text-neutral-400">No product images yet</p>
          <p className="mt-1 text-xs text-neutral-300">Add images from the Admin Dashboard</p>
        </div>
      </div>
    );
  }

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {images.map((img, index) => (
            <div key={img.id} className="min-w-0 flex-[0_0_100%]">
              <img
                src={img.public_url}
                alt={`${productName} — image ${index + 1}`}
                className="aspect-square w-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prev / next arrows (desktop) */}
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-soft backdrop-blur transition-transform hover:scale-105 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next image"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-soft backdrop-blur transition-transform hover:scale-105 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Pagination dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {images.map((img, index) => (
            <button
              key={img.id}
              aria-label={`Go to image ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === selected ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Count badge */}
      {images.length > 1 && (
        <span className="absolute right-3 top-3 rounded-full bg-neutral-900/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {selected + 1} / {images.length}
        </span>
      )}
    </div>
  );
}
