import React from 'react';
import { MarketInfoProps } from '@/types';
import { formatPrice, formatVolume, formatPercentage, getPriceChangeColor } from '@/utils/helpers';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const MarketInfo: React.FC<MarketInfoProps> = ({
  currentPrice,
  priceChange,
  priceChangePercent,
  volume,
  isLoading = false
}) => {
  const isPositive = priceChange >= 0;
  const priceColorClass = getPriceChangeColor(priceChange);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="metric-card animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Price */}
      <div className="metric-card">
        <div className="metric-label">Current Price</div>
        <div className={`metric-value ${priceColorClass}`}>
          ${formatPrice(currentPrice)}
        </div>
      </div>

      {/* 24h Change */}
      <div className="metric-card">
        <div className="metric-label">24h Change</div>
        <div className={`metric-value flex items-center space-x-1 ${priceColorClass}`}>
          {isPositive ? (
            <FaArrowUp className="w-4 h-4" />
          ) : (
            <FaArrowDown className="w-4 h-4" />
          )}
          <span>${formatPrice(Math.abs(priceChange))}</span>
        </div>
      </div>

      {/* 24h Change Percentage */}
      <div className="metric-card">
        <div className="metric-label">24h Change %</div>
        <div className={`metric-value flex items-center space-x-1 ${priceColorClass}`}>
          {isPositive ? (
            <FaArrowUp className="w-4 h-4" />
          ) : (
            <FaArrowDown className="w-4 h-4" />
          )}
          <span>{formatPercentage(priceChangePercent)}</span>
        </div>
      </div>

      {/* 24h Volume */}
      <div className="metric-card">
        <div className="metric-label">24h Volume</div>
        <div className="metric-value text-gray-900 dark:text-gray-100">
          {formatVolume(volume)}
        </div>
      </div>
    </div>
  );
};

export default MarketInfo;