"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Clip {
  id: number;
  filename: string;
  clip_url: string;
  title: string;
  duration: number;
  thumbnail_url?: string;
}

interface Video {
  id: number;
  filename: string;
  status: string;
  created_at: string;
  clips: Clip[];
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanAPI = API_RAW.endsWith('/') ? API_RAW.slice(0, -1) : API_RAW;

  useEffect(() => {
    const fetchVideos = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${cleanAPI}/videos`, {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
          setError(null);
        } else {
          setError(`Server replied with status ${res.status}`);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Unable to connect to the AI engine. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 animate-pulse">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Your Videos</h1>
        <Link href="/upload" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
          + New Video (3 Credits)
        </Link>
      </div>
      
      {error && (
        <div className="mb-10 bg-red-900/20 border border-red-500/50 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <svg className="w-8 h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <p className="text-red-400 font-bold text-lg">Connection Error</p>
            <p className="text-red-300 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-24 bg-gray-800 rounded-2xl border border-gray-700 shadow-xl">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </div>
          <p className="text-2xl font-bold text-gray-300 mb-4">No videos processed yet</p>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Upload your first long-form video to let our AI identify and crop the best viral moments for your social media channels.</p>
          <Link href="/upload" className="text-purple-400 hover:text-purple-300 font-medium border border-purple-500/30 bg-purple-500/10 px-6 py-3 rounded-lg transition hover:bg-purple-500/20">
            Upload your first video
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {videos.map(video => (
            <div key={video.id} className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl hover:shadow-purple-900/10 transition duration-300">
              <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 truncate max-w-2xl">{video.filename}</h2>
                  <p className="text-sm text-gray-500">Processed on {new Date(video.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wide flex items-center gap-2 shadow-inner ${
                  video.status === 'completed' ? 'bg-green-900/40 text-green-400 border border-green-800/60' :
                  video.status === 'failed' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                  'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60 animate-pulse'
                }`}>
                  {video.status === 'processing' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"></div>}
                  {video.status}
                </span>
              </div>
              
              {video.status === 'completed' && video.clips.length > 0 ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg text-white font-bold bg-gray-900 px-4 py-1 rounded-md border border-gray-700">Generated Clips ({video.clips.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {video.clips.map(clip => (
                      <div key={clip.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 group hover:border-purple-500 flex flex-col transition duration-300 shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1">
                        <div className="aspect-[9/16] bg-black relative flex items-center justify-center border-b border-gray-800">
                          {(() => {
                            const getFullUrl = (path: string) => {
                              if (!path) return '';
                              if (path.startsWith('http')) return path;
                              return `${cleanAPI}/${path.startsWith('/') ? path.slice(1) : path}`;
                            };
                            return (
                              <video 
                                src={getFullUrl(clip.clip_url)} 
                                controls 
                                className="w-full h-full object-cover"
                                poster={clip.thumbnail_url ? getFullUrl(clip.thumbnail_url) : "/placeholder-video.png"}
                              />
                            );
                          })()}
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <p className="font-bold text-md text-white mb-3 line-clamp-2 leading-snug" title={clip.title}>{clip.title}</p>
                          <div>
                            <div className="flex items-center bg-gray-800 rounded px-2 py-1 w-max mb-4">
                              <svg className="w-3 h-3 text-purple-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              <span className="text-xs text-gray-300 font-medium">{Math.round(clip.duration)} seconds</span>
                            </div>
                            <a 
                              href={`${cleanAPI}/videos/download/${clip.id}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-purple-600 hover:bg-purple-700 text-center block text-white py-2.5 rounded-lg text-sm font-bold transition shadow"
                            >
                              Download Clip
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (video.status === 'processing' || video.status === 'downloading' || video.status === 'pending') ? (
                <div className="py-12 text-center bg-gray-900/50 rounded-xl border border-gray-700/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-1/2 animate-ping absolute"></div>
                  </div>
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl text-purple-300 font-bold mb-2">
                    {video.status === 'downloading' ? 'Downloading video from source...' : 'AI is analyzing and clipping your video'}
                  </p>
                  <p className="text-sm text-gray-500">Extracting audio • Transcribing • Detecting viral hooks • Formatting to 9:16</p>
                  <p className="text-xs text-gray-600 mt-6 font-medium">This may take several minutes depending on video length. You can safely leave this page.</p>
                </div>
              ) : video.status === 'failed' ? (
                <div className="py-10 text-center bg-red-900/10 rounded-xl border border-red-900/30">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="text-lg text-red-400 font-bold">Failed to process video</p>
                  <p className="text-gray-500 mt-2">The system encountered an error. If credits were deducted, please contact support.</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center bg-gray-900/30 rounded-lg">No viral clips were detected in this video.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
