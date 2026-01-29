'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';

interface ImageUploaderProps {
  onUploadSuccess: (data: any) => void;
  marketId: string;
  title: string;
  instructions: string;
}

export default function ImageUploader({
  onUploadSuccess,
  marketId,
  title,
  instructions,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('marketId', marketId);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result.data);
        // 업로드 후 초기화하지 않고 미리보기 유지
      } else {
        alert('이미지 업로드 실패: ' + result.error);
      }
    } catch (error) {
      alert('오류 발생: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-dashed border-blue-300">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={20} className="text-blue-600" />
        <h3 className="font-semibold text-blue-900">{title} 스크린샷 업로드</h3>
      </div>

      <div className="mb-3 p-3 bg-white rounded text-sm text-gray-700">
        <p className="font-semibold mb-1">📸 캡처 방법:</p>
        <p className="whitespace-pre-wrap">{instructions}</p>
      </div>

      {preview ? (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-lg border border-gray-300"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              title="제거"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Upload size={20} />
                업로드 및 AI 분석
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer cursor-pointer"
              disabled={uploading}
            />
          </label>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-2">
        💡 PNG, JPG, WebP 등 이미지 파일을 지원합니다
      </p>
    </div>
  );
}
