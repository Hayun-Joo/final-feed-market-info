'use client';

interface TableData {
  title: string;
  subtitle: string;
  unit: string;
  headers: string[];
  rows: {
    label: string;
    values: (string | number)[];
    isBold?: boolean;
    isSubItem?: boolean;
  }[];
  ratioRow?: {
    label: string;
    values: string[];
  };
}

interface SupplyDemandTableProps {
  data: TableData;
}

export default function SupplyDemandTable({ data }: SupplyDemandTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{data.title}</h3>
            <p className="text-sm opacity-90">{data.subtitle}</p>
          </div>
          <div className="text-sm opacity-90">{data.unit}</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
              {data.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]"
                >
                  <div className="text-xs">{header.split(' ')[0]}</div>
                  <div className="text-xs">{header.split(' ').slice(1).join(' ')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-200 hover:bg-gray-50 ${
                  row.isBold ? 'bg-blue-50' : ''
                }`}
              >
                <td
                  className={`px-4 py-2 ${
                    row.isSubItem ? 'pl-8 text-sm' : ''
                  } ${row.isBold ? 'font-bold' : ''} text-gray-800`}
                >
                  {row.label}
                </td>
                {row.values.map((value, valueIdx) => (
                  <td
                    key={valueIdx}
                    className={`px-4 py-2 text-center ${
                      row.isBold ? 'font-bold' : ''
                    } text-gray-800`}
                  >
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </td>
                ))}
              </tr>
            ))}
            {data.ratioRow && (
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-4 py-2 font-bold text-gray-800">
                  {data.ratioRow.label}
                </td>
                {data.ratioRow.values.map((value, idx) => (
                  <td
                    key={idx}
                    className="px-4 py-2 text-center font-bold text-gray-800"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Download Section */}
      <div className="bg-gray-50 px-4 py-3 flex gap-3 justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
          Download Data (1 month)
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
          Download Data (1 year)
        </button>
      </div>
    </div>
  );
}

// Example usage data structure
export const exampleCornData: TableData = {
  title: 'USDA SUPPLY/DEMAND',
  subtitle: 'WORLD CORN',
  unit: '(Million Metric Tons)',
  headers: ['JAN USDA 23-24', 'JAN USDA 24-25', 'DEC USDA 25-26', 'JAN USDA 25-26'],
  rows: [
    { label: 'Supply', values: ['', '', '', ''], isBold: false },
    { label: 'Beginning Stocks', values: [305.36, 315.42, 293.37, 294.7], isSubItem: false },
    { label: 'Production', values: [1230.71, 1230.86, 1282.96, 1296.01], isBold: true },
    { label: 'Imports', values: [197.62, 186.1, 190.37, 190.22], isSubItem: false },
    { label: 'Use', values: ['', '', '', ''], isBold: false },
    { label: 'Feed, Domestic', values: [769.45, 787.52, 810.36, 813.24], isSubItem: true },
    { label: 'Total Domestic', values: [1220.65, 1251.59, 1297.18, 1299.8], isSubItem: false },
    { label: 'Exports', values: [192.65, 186.64, 205.1, 205.11], isSubItem: false },
    { label: 'Ending Stocks', values: [315.42, 294.7, 279.15, 290.91], isBold: true },
  ],
  ratioRow: {
    label: 'Stocks/Use Ratio',
    values: ['25.8%', '23.5%', '21.5%', '22.4%'],
  },
};
