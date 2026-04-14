"use client"
import Link from 'next/link';
import { Play, Scissors, MessageSquare, Flame } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden font-sans bg-white">
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 lg:pb-48 overflow-hidden rounded-b-[40px] lg:rounded-b-[80px] bg-gradient-to-br from-indigo-950 via-purple-800 to-pink-600">
        
        {/* Ambient Glowing Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-pink-500/40 rounded-full blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-400/30 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute top-40 left-[10%] w-[300px] h-[300px] bg-yellow-400/20 rounded-full blur-[80px] mix-blend-screen" />
          
          {/* Sparkles (CSS shapes) */}
          <div className="absolute top-32 left-[45%] text-white/50 animate-pulse text-2xl">✨</div>
          <div className="absolute top-52 right-[35%] text-yellow-300/60 text-3xl animate-pulse delay-300">✦</div>
          <div className="absolute bottom-40 left-[15%] text-pink-300/40 text-4xl animate-pulse delay-700">✦</div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            {/* Left Copy */}
            <div className="w-full lg:w-[55%] text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold leading-[1.15] text-white tracking-tight drop-shadow-lg">
                Turn your long videos into <br/><span className="text-[#ffbc00] drop-shadow-xl inline-block mt-2">viral clips</span> with AI
              </h1>

              <p className="mt-8 text-[18px] sm:text-[20px] text-white/95 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium drop-shadow-md">
                ContentWala AI auto generates short, viral clips from your long-form videos, perfect for TikTok, Instagram Reels, YouTube Shorts, and more.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row sm:justify-start items-center gap-4 sm:gap-6">
                <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#ffbc00] text-indigo-950 text-xl font-extrabold shadow-[0_0_30px_rgba(255,188,0,0.5)] hover:shadow-[0_0_40px_rgba(255,188,0,0.8)] hover:bg-[#ffc824] transition-all transform hover:-translate-y-1">
                  Generate Clips Now
                </Link>

                <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-white/40 text-white text-lg font-bold hover:bg-white/15 transition-all backdrop-blur-sm">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Right Graphic Mockup (Replaced with the Logo) */}
            <div className="w-full lg:w-[45%] relative flex justify-center items-center">
               <div className="relative w-full max-w-[450px] mx-auto transform hover:-translate-y-2 transition-transform duration-700 hover:scale-[1.02]">
                  {/* Glowing background ring */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#ffbc00] via-pink-500 to-purple-600 rounded-[3rem] blur-[60px] opacity-50 animate-pulse"></div>
                  
                  {/* Glassmorphism Card */}
                  <div className="relative rounded-[3rem] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border-[2px] border-white/30 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl flex items-center justify-center aspect-square overflow-hidden">
                    {/* Inner highlight for 3D glass effect */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                    
                    <img 
                      src="/logo.png?v=7" 
                      alt="ContentWala AI Logo" 
                      className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105" 
                    />
                    
                    {/* Floating Elements To Make It Pop */}
                    <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/20 backdrop-blur-lg rounded-[1.25rem] shadow-2xl flex items-center justify-center rotate-[15deg] animate-float z-20 border border-white/40">
                      <span className="text-3xl drop-shadow-lg filter scale-110">🔥</span>
                    </div>
                    <div className="absolute -left-4 bottom-8 w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl flex items-center justify-center -rotate-[15deg] animate-float-slow z-20 border border-white/30">
                      <span className="text-2xl drop-shadow-lg filter scale-110">✨</span>
                    </div>
                  </div>
               </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pt-24 pb-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] font-[800] text-[#1e1b4b] tracking-tight">
            Get viral-ready clips in minutes
          </h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col bg-white rounded-[32px] p-8 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-gray-100/50 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] transition-shadow duration-300 hover:-translate-y-1 transform">
              <div className="flex items-center justify-center w-20 h-20 rounded-[20px] bg-gradient-to-br from-purple-100 to-pink-50 text-purple-600 mb-8 border border-purple-100 shadow-inner mx-auto">
                <Scissors className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Quick Auto-Clipping</h3>
              <p className="mt-4 text-gray-600 leading-relaxed font-medium text-lg">Instantly segment long videos into bite-sized highlights using our AI engine.</p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col bg-white rounded-[32px] p-8 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-gray-100/50 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] transition-shadow duration-300 hover:-translate-y-1 transform">
              <div className="flex items-center justify-center w-20 h-20 rounded-[20px] bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 mb-8 border border-indigo-100 shadow-inner mx-auto">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Smart AI Captions</h3>
              <p className="mt-4 text-gray-600 leading-relaxed font-medium text-lg">Generate accurate, stylish captions that keep your viewers engaged everywhere.</p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col bg-white rounded-[32px] p-8 shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-gray-100/50 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)] transition-shadow duration-300 hover:-translate-y-1 transform">
              <div className="flex items-center justify-center w-20 h-20 rounded-[20px] bg-gradient-to-br from-orange-100 to-red-50 text-orange-600 mb-8 border border-orange-100 shadow-inner mx-auto">
                <Flame className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Viral Moment Detection</h3>
              <p className="mt-4 text-gray-600 leading-relaxed font-medium text-lg">Our AI identifies the most engaging hooks and segments to maximize your reach.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <img src="/logo.png?v=6" alt="logo" className="h-8 w-auto grayscale opacity-70" />
             <span className="font-bold text-gray-400 text-lg">ContentWala AI</span>
          </div>
          <p className="text-gray-500 font-medium text-sm text-center md:text-left">
            © {new Date().getFullYear()} ContentWala AI — Accelerating your social growth.
          </p>
        </div>
      </footer>
    </main>
  );
}
