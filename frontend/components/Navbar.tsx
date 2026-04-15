"use client"
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
          router.push('/login');
        }
        return;
      }
      try {
        const API_RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const API = API_RAW.endsWith('/') ? API_RAW.slice(0, -1) : API_RAW;
        const res = await fetch(`${API}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  }

  // Hide exact navbar matching these public paths
  if (['/', '/login', '/signup'].includes(pathname)) return null;

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg border-b border-gray-700 flex justify-between items-center sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-3 transform hover:scale-105 transition group">
        <div className="bg-white p-1.5 rounded-xl shadow-md border border-gray-600 group-hover:shadow-purple-500/20 transition-all">
          <img src="/logo.png?v=9" alt="ContentWala AI Logo" className="h-8 w-auto object-contain" />
        </div>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="hover:text-purple-400 font-medium transition">Dashboard</Link>
        <Link href="/upload" className="hover:text-purple-400 font-medium transition">Upload Video</Link>
        <Link href="/pricing" className="hover:text-purple-400 font-medium transition">Pricing</Link>
        
        <div className="bg-gray-900 px-5 py-2 rounded-full border border-gray-600 flex items-center gap-2 shadow-inner">
          <span className="text-sm text-gray-400">Credits:</span>
          <span className="font-bold text-yellow-500 text-lg">{credits ?? '...'}</span>
        </div>
        
        <button onClick={handleLogout} className="text-sm bg-gray-700 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-all shadow-md">
          Logout
        </button>
      </div>
    </nav>
  );
}
