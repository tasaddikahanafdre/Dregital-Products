import { Play, Youtube } from 'lucide-react';
import type { PublicSettings } from '../../types';

interface VideoSectionProps {
  video: PublicSettings['video'];
}

export default function VideoSection({ video }: VideoSectionProps) {
  if (!video?.url) return null;

  const isFacebook = video.type === 'facebook';

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">
          Watch the video
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          <Youtube className="h-3.5 w-3.5 text-brand-500" />
          {isFacebook ? 'Facebook' : 'YouTube'}
        </span>
      </div>

      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-3xl bg-neutral-900 shadow-lift"
        aria-label="Play product video"
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt="Product video thumbnail"
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center">
            <span className="text-sm text-neutral-400">Video preview</span>
          </div>
        )}

        {/* Dark overlay + play button */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/50 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-lift transition-transform duration-300 group-hover:scale-110">
            <Play className="h-7 w-7 fill-current pl-0.5" />
          </span>
        </div>
        <span className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
          See {isFacebook ? 'it on Facebook' : 'it on YouTube'}
        </span>
      </a>
    </section>
  );
}
