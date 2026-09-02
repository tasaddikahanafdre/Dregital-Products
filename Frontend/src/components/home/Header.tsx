import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" aria-label="Dregital home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
