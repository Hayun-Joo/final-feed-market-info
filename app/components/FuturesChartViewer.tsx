'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FuturesChartProps {
  symbol: string;
  contractMonth: string;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  volume: string;
  imageBase64?: string;
  chartUrl?: string;
}

export default function FuturesChartViewer({
  symbol,
  contractMonth,
  currentPrice,
  priceChange,
  percentChange,
  volume,
  imageBase64,
  chartUrl,
}: FuturesChartProps) {
  const [timeframe, setTimeframe] = useState('1D');
  const isPositive = priceChange >= 0;

  const timeframes = ['1m', '30m', '1h', 'D'];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chart Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
              {symbol.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {symbol} Futures ({contractMonth})
              </h3>
              <p className="text-xs text-gray-600">1D · CBOT</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {currentPrice.toFixed(2)}
                </span>
                {isPositive ? (
                  <TrendingUp className="text-green-600" size={24} />
                ) : (
                  <TrendingDown className="text-red-600" size={24} />
                )}
              </div>
              <div
                className={`text-sm font-semibold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {priceChange.toFixed(2)} ({isPositive ? '+' : ''}
                {percentChange.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-gray-600 mr-2">Timeframe:</span>
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm transition ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative bg-white p-4">
        {imageBase64 ? (
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt={`${symbol} Chart`}
            className="w-full h-auto"
          />
        ) : chartUrl ? (
          <iframe
            src={chartUrl}
            className="w-full h-96 border-0"
            title={`${symbol} Chart`}
          />
        ) : (
          <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded">
            <p className="text-gray-500">Chart loading...</p>
          </div>
        )}
      </div>

      {/* Volume Info */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Volume</span>
          <span className="text-sm font-semibold text-gray-900">{volume}</span>
        </div>
      </div>
    </div>
  );
}
