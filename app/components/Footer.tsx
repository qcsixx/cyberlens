'use client';

import { HeartIcon } from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-slate-800 border-t border-slate-700 py-4 px-6 text-center">
      <div className="container mx-auto">
        <p className="text-slate-400 text-sm flex items-center justify-center">
          <span>CyberLens &copy; {new Date().getFullYear()} - Dibuat dengan</span>
          <HeartIcon className="h-4 w-4 text-red-500 mx-1" />
          <span>oleh Tim Keamanan Siber</span>
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Aplikasi ini menggunakan teknologi OCR dan AI untuk mendeteksi ancaman keamanan
        </p>
      </div>
    </footer>
  );
} 