'use client';

import { useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageViewerProps {
  imageBase64: string;
  title: string;
  onDownload?: () => void;
}

export default function ImageViewer({ imageBase64, title, onDownload }: ImageViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageBase64}`;
      link.download = `${title.replace(/\s/g, '_')}_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          title="축소"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          title="확대"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
          title="다운로드"
        >
          <Download size={18} />
        </button>
      </div>

      <div className="overflow-auto max-h-96">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt={title}
          className="w-full transition-transform"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}
