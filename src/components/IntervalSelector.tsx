import React from 'react';
import { IntervalSelectorProps } from '@/types';
import { INTERVAL_DISPLAY_NAMES } from '@/utils/constants';

const IntervalSelector: React.FC<IntervalSelectorProps> = ({
  selectedInterval,
  availableIntervals,
  onChange
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2 flex items-center">
        Timeframe:
      </label>
      <div className="flex flex-wrap gap-1">
        {availableIntervals.map((interval) => (
          <button
            key={interval}
            onClick={() => onChange(interval)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              selectedInterval === interval
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-pressed={selectedInterval === interval}
          >
            {INTERVAL_DISPLAY_NAMES[interval as keyof typeof INTERVAL_DISPLAY_NAMES] || interval}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IntervalSelector;