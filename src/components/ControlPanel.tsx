import React from 'react';
import PairSelector from './PairSelector';
import IntervalSelector from './IntervalSelector';
import ChartTypeToggle from './ChartTypeToggle';
import { TradingPair } from '@/types';
import { SUPPORTED_PAIRS, SUPPORTED_INTERVALS } from '@/utils/constants';

interface ControlPanelProps {
  selectedPair: TradingPair;
  selectedInterval: string;
  chartType: 'candlestick' | 'line';
  onPairChange: (pair: TradingPair) => void;
  onIntervalChange: (interval: string) => void;
  onChartTypeChange: (type: 'candlestick' | 'line') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedPair,
  selectedInterval,
  chartType,
  onPairChange,
  onIntervalChange,
  onChartTypeChange
}) => {
  return (
    <div className="control-panel">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
        {/* Trading pair selector */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Trading Pair:
          </label>
          <PairSelector
            selectedPair={selectedPair}
            availablePairs={SUPPORTED_PAIRS}
            onChange={onPairChange}
          />
        </div>

        {/* Interval selector */}
        <IntervalSelector
          selectedInterval={selectedInterval}
          availableIntervals={SUPPORTED_INTERVALS}
          onChange={onIntervalChange}
        />

        {/* Chart type toggle */}
        <ChartTypeToggle
          chartType={chartType}
          onChange={onChartTypeChange}
        />
      </div>
    </div>
  );
};

export default ControlPanel;