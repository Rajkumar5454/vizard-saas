"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LandingNavbar() {
  const pathname = usePathname();
  if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') return null;

  return (
    <header className="w-full absolute top-6 left-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-between px-6 py-4 bg-white rounded-full shadow-2xl">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png?v=6" alt="logo" className="h-8 w-auto object-contain" />
            <span className="hidden sm:inline-block font-extrabold text-xl text-[#1e1b4b] tracking-tight">ContentWala <span className="text-pink-600">AI</span></span>
          </Link>

          {/* Center: Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[15px] font-semibold text-gray-600 hover:text-purple-600 transition-colors">Features</a>
            <Link href="/pricing" className="text-[15px] font-semibold text-gray-600 hover:text-purple-600 transition-colors">Pricing</Link>
          </div>

          {/* Right: Auth */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/login" className="hidden sm:block text-[15px] font-semibold text-gray-600 hover:text-purple-600 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-[#ffbc00] text-gray-900 px-6 py-3 rounded-full hover:bg-[#ffc824] transition-all transform hover:-translate-y-0.5 shadow-lg">
              SIGN UP FOR FREE
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
