import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-neutral-100 bg-neutral-50 pb-28 pt-10 md:pb-10">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          Premium quality, delivered to your door.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-400">
          <span>Cash on Delivery</span>
          <span className="h-3 w-px bg-neutral-200" />
          <span>All over Bangladesh</span>
        </div>
        <p className="mt-6 text-xs text-neutral-300">
          © {new Date().getFullYear()} Dregital. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
