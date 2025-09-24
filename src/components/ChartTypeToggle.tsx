import React from 'react';
import { FaChartLine, FaChartBar } from 'react-icons/fa';

interface ChartTypeToggleProps {
  chartType: 'candlestick' | 'line';
  onChange: (type: 'candlestick' | 'line') => void;
}

const ChartTypeToggle: React.FC<ChartTypeToggleProps> = ({ chartType, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Chart Type:
      </label>
      <div className="chart-type-toggle">
        <button
          onClick={() => onChange('candlestick')}
          className={`chart-type-button ${
            chartType === 'candlestick' ? 'active' : 'inactive'
          }`}
          aria-pressed={chartType === 'candlestick'}
        >
          <FaChartBar className="w-4 h-4 mr-1.5" />
          Candlestick
        </button>
        <button
          onClick={() => onChange('line')}
          className={`chart-type-button ${
            chartType === 'line' ? 'active' : 'inactive'
          }`}
          aria-pressed={chartType === 'line'}
        >
          <FaChartLine className="w-4 h-4 mr-1.5" />
          Line
        </button>
      </div>
    </div>
  );
};

export default ChartTypeToggle;