import React from 'react';
import { ChartType } from './AdvancedTradingChart';

interface ChartTypeSelectorProps {
  currentType: ChartType;
  onTypeChange: (type: ChartType) => void;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  currentType,
  onTypeChange
}) => {
  const chartTypes: { type: ChartType; label: string; icon: string; description: string }[] = [
    {
      type: 'candlestick',
      label: 'Candlestick',
      icon: '📊',
      description: 'OHLC candlestick chart like Binance'
    },
    {
      type: 'line',
      label: 'Line',
      icon: '📈',
      description: 'Clean line chart'
    },
    {
      type: 'area',
      label: 'Area',
      icon: '🌄',
      description: 'Filled area chart'
    },
    {
      type: 'bar',
      label: 'Bar',
      icon: '📊',
      description: 'OHLC bar chart'
    },
    {
      type: 'volume',
      label: 'Volume',
      icon: '📊',
      description: 'Volume bars'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Chart Type:</span>
      {chartTypes.map(({ type, label, icon, description }) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentType === type
              ? 'bg-yellow-400 text-black shadow-lg transform scale-105'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-gray-600'
          }`}
          title={description}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ChartTypeSelector;