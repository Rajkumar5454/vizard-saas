"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder: wire to backend as needed
    console.log('signup', { name, email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-10 border border-white/30">
          {/* If your layout already renders the logo at top (navbar), omit it here to avoid duplicates */}
          <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">Create your account</h2>
              <p className="mt-2 text-sm text-gray-600">Join ContentWala and start generating viral clips.</p>
            </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Create a strong password"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 py-3 text-white font-semibold shadow-md hover:scale-[1.01] transition-transform"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <span>Already have an account? </span>
            <Link href="/login" className="text-purple-600 font-semibold">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
