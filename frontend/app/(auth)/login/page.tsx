"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const API_RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanAPI = API_RAW.endsWith('/') ? API_RAW.slice(0, -1) : API_RAW;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${cleanAPI}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      
      const pendingUrl = localStorage.getItem('pendingYoutubeUrl');
      if (pendingUrl) {
         localStorage.removeItem('pendingYoutubeUrl');
         try {
           await fetch(`${cleanAPI}/videos/youtube`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${data.access_token}`
             },
             body: JSON.stringify({ url: pendingUrl })
           });
         } catch(e) {}
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${cleanAPI}/users/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      if (!res.ok) throw new Error("Google login failed");
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      
      const pendingUrl = localStorage.getItem('pendingYoutubeUrl');
      if (pendingUrl) {
         localStorage.removeItem('pendingYoutubeUrl');
         try {
           await fetch(`${cleanAPI}/videos/youtube`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${data.access_token}`
             },
             body: JSON.stringify({ url: pendingUrl })
           });
         } catch(e) {}
      }
      
      router.push('/dashboard');
    } catch(err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <Link href="/" className="mb-8 transform hover:scale-105 transition-transform">
        <img src="/logo.png?v=5" alt="ContentWala AI" className="h-24 w-auto drop-shadow-2xl mix-blend-multiply contrast-[1.1] brightness-[1.1] [clip-path:ellipse(45%_45%_at_50%_50%)]" />
      </Link>
      <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-gray-700">
        <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Welcome</h2>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <input 
            type="email" placeholder="Email address" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
          <input 
            type="password" placeholder="Password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 rounded-xl px-4 py-3 mb-8 focus:outline-none focus:ring-2 focus:ring-purple-500" 
          />
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
            Login
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col items-center">
          <p className="text-gray-400 text-sm mb-4">Or sign in with</p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign in failed')}
            theme="filled_black"
            shape="pill"
            text="signin_with"
          />
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          New here? <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
