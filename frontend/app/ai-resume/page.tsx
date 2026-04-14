"use client";

import { useState } from 'react';

export default function AIResumeBooster() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    // Simulate a short delay to mimic processing
    setTimeout(() => {
      // Dummy improved text — replace with real AI call later
      const improved = `Improved Resume (example):\n\n${input ? input.slice(0, 800) : 'No resume provided.'}\n\n- Strong, quantifiable achievements added.\n- Clear, concise bullet points.\n- Optimized for recruiter skimming.`;
      setOutput(improved);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">AI Resume Booster</h1>

        <p className="mt-3 text-center text-sm text-gray-500">Paste your resume below and click Generate to see an improved version (dummy output for now).</p>

        <label className="block mt-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your resume, LinkedIn summary, or work history here..."
            className="w-full min-h-[180px] md:min-h-[220px] p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-vertical"
          />
        </label>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800">Output</h2>
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4 min-h-[120px] whitespace-pre-wrap text-sm text-gray-800">
            {output || (
              <span className="text-gray-400">Your improved resume will appear here after you click Generate.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
