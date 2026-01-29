'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface PDFUploaderProps {
  onUploadSuccess: (data: any) => void;
  productType: 'soybean' | 'corn' | 'wheat';
}

export default function PDFUploader({ onUploadSuccess, productType }: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('productType', productType);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result.data);
        setFile(null);
      } else {
        alert('PDF 업로드 실패: ' + result.error);
      }
    } catch (error) {
      alert('오류 발생: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-dashed border-indigo-300">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={20} className="text-indigo-600" />
        <h3 className="font-semibold text-indigo-900">USDA S&D 보고서 업로드</h3>
      </div>

      <div className="space-y-3">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-600 file:text-white
            hover:file:bg-indigo-700
            file:cursor-pointer cursor-pointer"
          disabled={uploading}
        />

        {file && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">선택됨: {file.name}</span>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  업로드 및 분석
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-2">
        💡 <a
          href="https://www.cmegroup.com/trading/agricultural/corn-reports.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          CME Corn Reports
        </a> 페이지에서 왼쪽 위 'USDA Supply&Demand' PDF를 다운로드하여 업로드하세요.
      </p>
    </div>
  );
}
