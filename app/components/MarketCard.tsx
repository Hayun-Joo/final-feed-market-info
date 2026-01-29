'use client';

import { useState } from 'react';
import { Download, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import ImageViewer from './ImageViewer';
import ChatBot from './ChatBot';

interface MarketCardProps {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

interface MarketData {
  imageBase64?: string;
  currentPrice?: string;
  priceUnit?: string;
  summary?: string;
  lastUpdated?: string;
  pdfAnalysis?: {
    translation: string;
    keyPoints: string[];
    tableData?: string;
  };
  pdfUrl?: string;
  productionChart?: string;
  stocksChart?: string;
}

export default function MarketCard({
  id,
  title,
  emoji,
  description,
  color,
}: MarketCardProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [pdfData, setPdfData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 자동 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scrape/${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData({
          imageBase64: result.data.imageBase64,
          currentPrice: result.data.currentPrice,
          priceUnit: result.data.priceUnit,
          summary: result.data.summary,
          lastUpdated: result.data.lastUpdated || new Date().toISOString(),
          pdfAnalysis: result.data.pdfAnalysis,
          pdfUrl: result.data.pdfUrl,
          productionChart: result.data.productionChart,
          stocksChart: result.data.stocksChart,
        });

        // PDF 분석 결과가 있으면 setPdfData에도 저장
        if (result.data.pdfAnalysis) {
          setPdfData({
            analysis: result.data.pdfAnalysis,
            pdfUrl: result.data.pdfUrl,
          });
        }
      } else {
        setError(result.error || '데이터를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (data?.imageBase64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${data.imageBase64}`;
      link.download = `${id}_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200`}
    >
      {/* Card Header */}
      <div className="p-6 bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-600 hover:text-gray-900 transition"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!data && (
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  데이터 가져오는 중...
                </>
              ) : (
                <>
                  <Download size={16} />
                  데이터 가져오기
                </>
              )}
            </button>
          )}
          {data && (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Download size={16} />
                다운로드
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <MessageSquare size={16} />
                AI 챗봇
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                {loading ? '새로고침 중...' : '새로고침'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data Content */}
      {expanded && (
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">오류 발생</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="font-semibold">데이터 수집 중...</p>
                <p className="text-sm">웹사이트에서 최신 정보를 가져오고 있습니다.</p>
              </div>
            </div>
          )}


          {/* PDF Analysis Result */}
          {pdfData?.analysis && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
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

          {/* Image and Analysis */}
          {data && (
            <>
              {/* Image Viewer - 일반 차트 */}
              {data.imageBase64 && (
                <ImageViewer
                  imageBase64={data.imageBase64}
                  title={title}
                  onDownload={handleDownload}
                />
              )}

              {/* 에탄올 - Production Chart */}
              {id === 'ethanol' && data.productionChart && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">📊 US Ethanol Production</h3>
                  <img
                    src={`data:image/png;base64,${data.productionChart}`}
                    alt="US Ethanol Production"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* 에탄올 - Stocks Chart */}
              {id === 'ethanol' && data.stocksChart && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">📦 US Ethanol Stocks</h3>
                  <img
                    src={`data:image/gif;base64,${data.stocksChart}`}
                    alt="US Ethanol Stocks"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* AI Summary */}
              {data.summary && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    🤖 AI 핵심 요약
                  </h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {data.summary}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {data.lastUpdated && (
                <p className="text-xs text-gray-500 text-center">
                  마지막 업데이트: {new Date(data.lastUpdated).toLocaleString('ko-KR')}
                </p>
              )}

              {/* ChatBot */}
              {showChat && (
                <div className="mt-4">
                  <ChatBot
                    dataId={id}
                    dataContext={JSON.stringify({
                      title,
                      summary: data.summary,
                      currentPrice: data.currentPrice,
                    })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
