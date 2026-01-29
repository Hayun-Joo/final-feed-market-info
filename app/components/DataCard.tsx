'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Clock } from 'lucide-react';
import ImageViewer from './ImageViewer';
import ChatBot from './ChatBot';
import LoadingSpinner from './LoadingSpinner';
import PDFUploader from './PDFUploader';

interface DataCardProps {
  id: string;
  title: string;
  category: 'grain' | 'oil' | 'ethanol';
}

export default function DataCard({ id, title, category }: DataCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scrape/${id}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '데이터 수집 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드
    fetchData();
  }, [id]);

  const handlePDFUpload = (uploadedData: any) => {
    setPdfData(uploadedData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {category === 'grain' && '🌾'}
          {category === 'oil' && '🛢️'}
          {category === 'ethanol' && '⚗️'}
          {title}
        </h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          title="데이터 새로고침"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && <LoadingSpinner message="데이터 수집 중..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">오류 발생</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* PDF 업로더 - 곡물 카테고리만 */}
          {category === 'grain' && (
            <PDFUploader
              onUploadSuccess={handlePDFUpload}
              productType={id as 'soybean' | 'corn' | 'wheat'}
            />
          )}

          {/* PDF 분석 결과 */}
          {pdfData?.analysis && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                📊 USDA S&D 분석 결과
              </h3>

              {pdfData.analysis.tableData && (
                <div className="mb-3 p-3 bg-white rounded border">
                  <p className="text-xs font-semibold text-gray-700 mb-1">표 데이터</p>
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {pdfData.analysis.tableData}
                  </pre>
                </div>
              )}

              {pdfData.analysis.translation && (
                <div className="mb-3 p-3 bg-white rounded border">
                  <p className="text-xs font-semibold text-gray-700 mb-1">설명 번역</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {pdfData.analysis.translation}
                  </p>
                </div>
              )}

              {pdfData.analysis.keyPoints && pdfData.analysis.keyPoints.length > 0 && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs font-semibold text-gray-700 mb-2">핵심 요약</p>
                  <ul className="space-y-1">
                    {pdfData.analysis.keyPoints.map((point: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 가격 정보 */}
          {data.currentPrice && data.currentPrice !== 'N/A' && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">현재 선물가</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {data.currentPrice} {data.priceUnit || 'c/bu'}
                  </p>
                </div>
                <TrendingUp size={32} className="text-blue-600" />
              </div>
            </div>
          )}

          {/* 이미지 */}
          {data.imageBase64 && (
            <ImageViewer imageBase64={data.imageBase64} title={title} />
          )}

          {/* AI 요약 */}
          {data.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                🤖 AI 핵심 요약
              </h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {data.summary}
              </div>
            </div>
          )}

          {/* 업데이트 시간 */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={14} />
            <span>마지막 업데이트: {new Date(data.lastUpdated).toLocaleString('ko-KR')}</span>
          </div>

          {/* AI 챗봇 */}
          <ChatBot
            dataId={id}
            dataContext={JSON.stringify({
              title,
              summary: data.summary,
              currentPrice: data.currentPrice,
              rawData: data.rawData,
            })}
          />
        </div>
      )}
    </div>
  );
}
