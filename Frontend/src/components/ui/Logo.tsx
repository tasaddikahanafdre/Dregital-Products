import { useState } from 'react';

interface LogoProps {
  /** 'dark' text on light backgrounds (default), 'light' text for dark backgrounds. */
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * Brand logo. Uses /assets/logo.png (drop your logo there) and falls back to
 * a styled wordmark if the file is not present.
 */
export default function Logo({ variant = 'dark', className = '' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`font-display text-xl font-extrabold tracking-tight ${
          variant === 'dark' ? 'text-neutral-900' : 'text-white'
        } ${className}`}
      >
        Pawsum
      </span>
    );
  }

  return (
    <img
      src="/assets/logo.png"
      alt="Pawsum"
      className={`h-9 w-auto object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
