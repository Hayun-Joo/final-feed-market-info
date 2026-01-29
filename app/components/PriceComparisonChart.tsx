'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

interface PriceData {
  name: string;
  high: number;
  low: number;
  average: number;
  spread: number;
}

interface PriceComparisonChartProps {
  title: string;
  dateRange: string;
  priceData: PriceData[];
  imageBase64?: string;
  availableOptions?: Array<{ value: string; label: string }>;
}

export default function PriceComparisonChart({
  title,
  dateRange,
  priceData,
  imageBase64,
  availableOptions = [],
}: PriceComparisonChartProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    priceData.map((d) => d.name)
  );

  const handleDownload = (period: string) => {
    console.log(`Downloading data for ${period}`);
  };

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="bg-gray-100 border-b border-gray-300">
        <div className="flex">
          <button className="px-6 py-3 bg-white border-b-2 border-blue-600 font-semibold text-gray-900">
            {title}
          </button>
          <button className="px-6 py-3 text-gray-600 hover:bg-gray-50">
            MGO
          </button>
          <button className="px-6 py-3 text-gray-600 hover:bg-gray-50">
            IFO380 (HSFO)
          </button>
          <button className="px-6 py-3 text-gray-600 hover:bg-gray-50">
            Scrubber Spread
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6">
        {imageBase64 ? (
          <div className="mb-6">
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt={title}
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-50 flex items-center justify-center rounded border-2 border-dashed border-gray-300 mb-6">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        )}

        {/* Download Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => handleDownload('1 month')}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Download Data (1 month)
          </button>
          <button
            onClick={() => handleDownload('1 year')}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Download Data (1 year)
          </button>
        </div>

        {/* Statistics Table */}
        <div className="border border-gray-300 rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {dateRange}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  High
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Low
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Average
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Spread
                </th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((data, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-red-700">
                    {data.name}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    ${data.high.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    ${data.low.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    ${data.average.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    ${data.spread.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selection Controls */}
        <div className="mt-6 space-y-4">
          {priceData.map((data, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    idx === 0 ? 'bg-red-600' : 'bg-gray-400'
                  }`}
                ></div>
                <select className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white">
                  <option>{data.name.split(' - ')[0]}</option>
                </select>
                <select className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white">
                  <option>{data.name.split(' - ')[1] || data.name}</option>
                </select>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                ⊗ Remove from Graph
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button className="text-blue-600 hover:text-blue-700 font-semibold">
            + Add More Ports/Grades
          </button>
        </div>
      </div>
    </div>
  );
}

// Example usage
export const exampleOilPriceData: PriceData[] = [
  {
    name: 'Singapore - VLSFO',
    high: 531.0,
    low: 421.0,
    average: 467.5,
    spread: 110.0,
  },
  {
    name: 'WTI - WTI',
    high: 536.37,
    low: 420.09,
    average: 465.0,
    spread: 116.28,
  },
];
