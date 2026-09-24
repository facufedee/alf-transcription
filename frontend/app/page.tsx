import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-2">👽 ALF</h1>
          <p className="text-xl text-gray-100">
            Alien Live Feed
          </p>
        </div>

        <p className="text-2xl mb-8 max-w-2xl">
          Real-time transcription for live conferences
        </p>

        <p className="text-gray-100 mb-8 max-w-2xl">
          Simultaneous sessions, instant subtitles (original language + Spanish).
          <br />
          Open source, zero cost, built for accessibility at scale.
        </p>

        <div className="flex gap-4 justify-center">
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Watch Live
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition">
            GitHub
          </button>
        </div>

        <p className="text-sm text-gray-200 mt-12">
          🎉 Built for Nerdearla 2026
        </p>
      </div>
    </main>
  );
}
