"use client"
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const API_RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanAPI = API_RAW.endsWith('/') ? API_RAW.slice(0, -1) : API_RAW;
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError("Please upload a valid video file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError("Please upload a valid video file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${cleanAPI}/videos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }
      
    router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    setUploading(true);
    setError('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${cleanAPI}/videos/youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: youtubeUrl })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Processing failed");
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[80vh] flex flex-col justify-center">
      <h1 className="text-4xl font-extrabold mb-3 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">New AI Project</h1>
      <p className="text-gray-400 text-center mb-10 text-lg">Upload a long-form video and let our AI extract the best viral components for your shorts!</p>
      
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800/50 p-1.5 rounded-2xl border border-gray-700/50 flex gap-2">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'upload' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Local File
          </button>
          <button 
            onClick={() => setActiveTab('youtube')}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'youtube' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            YouTube Link
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div 
          className={`border-4 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-300 ${
            dragActive ? 'border-purple-500 bg-purple-900/10 scale-[1.02]' : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/*" 
            onChange={handleChange} 
            className="hidden" 
          />
          
          {!file ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-800 border border-gray-700 shadow-xl rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-2xl font-bold mb-2">Drag and drop your video here</p>
              <p className="text-gray-400 mb-8">MP4, MOV, or WEBM format (Max 2GB)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-700/80 hover:bg-gray-600 px-8 py-3 rounded-xl font-bold shadow-lg transition hover:-translate-y-0.5"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-purple-900/40 border-2 border-purple-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <p className="text-2xl font-bold mb-1 truncate max-w-sm">{file.name}</p>
              <p className="text-purple-400 mb-10 font-medium">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              
              <div className="flex gap-6">
                <button 
                  onClick={() => setFile(null)}
                  className="bg-gray-700/80 hover:bg-gray-600 px-8 py-3 rounded-xl font-bold shadow transition"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-extrabold shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center min-w-[300px] ${uploading ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing Upload...
                    </>
                  ) : (
                    'Generate Viral Clips (3 Credits)'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/30 border-2 border-gray-700 rounded-[2.5rem] p-16 text-center">
          <div className="w-24 h-24 bg-gray-800 border border-gray-700 shadow-xl rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Import from YouTube</h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">Paste a link to any YouTube video and we'll download it and extract the best parts for you.</p>
          
          <form onSubmit={handleYoutubeSubmit} className="max-w-2xl mx-auto flex gap-3 p-2 bg-gray-900 border border-gray-700 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500 transition shadow-inner">
            <input 
              type="text" 
              placeholder="Paste YouTube URL here..." 
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-white text-lg"
              autoFocus
            />
            <button 
              type="submit"
              disabled={uploading || !youtubeUrl}
              className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 ${uploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {uploading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Get Clips'}
            </button>
          </form>
        </div>
      )}
      
      {error && (
        <div className="mt-8 p-6 bg-red-900/20 border-2 border-red-900/50 rounded-xl text-center shadow-lg transform transition animate-fade-in">
          <p className="text-red-400 font-bold mb-2 text-lg">{error}</p>
          {error.toLowerCase().includes('credits') && (
            <button onClick={() => router.push('/pricing')} className="mt-2 text-sm bg-red-800 hover:bg-red-700 font-bold text-white px-6 py-2 rounded-lg transition shadow-md">
              View Pricing Packages
            </button>
          )}
        </div>
      )}
    </div>
  );
}
