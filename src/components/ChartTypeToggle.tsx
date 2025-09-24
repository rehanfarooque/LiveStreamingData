import React from 'react';
import { FaChartLine, FaChartBar } from 'react-icons/fa';
import { BsBarChart } from 'react-icons/bs';

interface ChartTypeToggleProps {
  chartType: 'candlestick' | 'line' | 'ohlc';
  onChange: (type: 'candlestick' | 'line' | 'ohlc') => void;
}

const ChartTypeToggle: React.FC<ChartTypeToggleProps> = ({ chartType, onChange }) => {
  const chartTypes = [
    { type: 'candlestick' as const, icon: FaChartBar, label: 'Candlestick' },
    { type: 'line' as const, icon: FaChartLine, label: 'Line' },
    { type: 'ohlc' as const, icon: BsBarChart, label: 'OHLC Bar' }
  ];

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Chart Type:
      </label>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {chartTypes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`
              flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${chartType === type
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
            aria-pressed={chartType === type}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartTypeToggle;