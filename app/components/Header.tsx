'use client';

import { Search, Menu, Globe } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Globe className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">
            Feed Market Info
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="검색"
          >
            <Search size={24} className="text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            onClick={() => setMenuOpen(!menuOpen)}
            title="메뉴"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-4">
            <ul className="space-y-2">
              <li>
                <a href="#periodic-reports" className="block px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-700">
                  주기 리포트
                </a>
              </li>
              <li>
                <a href="#supply-charts" className="block px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-700">
                  공급 차트
                </a>
              </li>
              <li>
                <a href="#demand-charts" className="block px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-700">
                  수요 차트
                </a>
              </li>
              <li>
                <a href="#fundamental-reference" className="block px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-700">
                  기본 참고자료
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
