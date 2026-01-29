'use client';

import { useState } from 'react';
import MarketCard from './components/MarketCard';
import ChatBot from './components/ChatBot';
import { MessageSquare, X } from 'lucide-react';

export default function Home() {
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const markets = [
    {
      id: 'soybean',
      title: '대두 (Soybean)',
      emoji: '🌱',
      description: 'WORLD S&D 표 + 선물 차트',
      color: 'from-green-50 to-emerald-50',
    },
    {
      id: 'corn',
      title: '옥수수 (Corn)',
      emoji: '🌽',
      description: 'WORLD S&D 표 + 선물 차트',
      color: 'from-yellow-50 to-amber-50',
    },
    {
      id: 'wheat',
      title: '소맥 (Wheat)',
      emoji: '🌾',
      description: 'WORLD S&D 표 + 선물 차트',
      color: 'from-orange-50 to-yellow-50',
    },
    {
      id: 'oil',
      title: '유가 (Oil Price)',
      emoji: '🛢️',
      description: 'Singapore VLSFO + WTI 비교 차트',
      color: 'from-blue-50 to-cyan-50',
    },
    {
      id: 'ethanol',
      title: '에탄올 (Ethanol)',
      emoji: '⚗️',
      description: 'Production + Stocks 그래프',
      color: 'from-purple-50 to-pink-50',
    },
    {
      id: 'exchange',
      title: '환율 (USD/KRW)',
      emoji: '💵',
      description: '미국 달러 환율 3개월 추이',
      color: 'from-indigo-50 to-purple-50',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            배합사료 원료 시황 대시보드
          </h1>
          <p className="text-lg text-gray-600">
            실시간 곡물, 유가, 에탄올 시장 정보를 한눈에 확인하세요
          </p>
        </header>

        {/* Global AI Chat */}
        <div className="mb-8 flex justify-center">
          {!showGlobalChat ? (
            <button
              onClick={() => setShowGlobalChat(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <MessageSquare size={20} />
              <span className="font-semibold">AI 시황 분석 채팅</span>
            </button>
          ) : (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare size={24} />
                  <h2 className="font-bold text-lg">실시간 AI 시황 분석</h2>
                </div>
                <button
                  onClick={() => setShowGlobalChat(false)}
                  className="p-1 text-white hover:bg-white/20 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <ChatBot
                  dataId="global"
                  dataContext="배합사료 원료 시장 전반에 대해 질문하세요. 대두, 옥수수, 소맥, 유가, 에탄올, 환율 등 모든 시장 정보를 분석할 수 있습니다."
                />
              </div>
            </div>
          )}
        </div>

        {/* Market Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              id={market.id}
              title={market.title}
              emoji={market.emoji}
              description={market.description}
              color={market.color}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
