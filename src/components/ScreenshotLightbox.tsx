'use client';

import React from 'react';
import { X, Download } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ScreenshotLightbox: React.FC<LightboxProps> = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `job-screenshot-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <button
            onClick={handleDownload}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
            title="Download Screenshot"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Job Posting Screenshot"
          className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
};
