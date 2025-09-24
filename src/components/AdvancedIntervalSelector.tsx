import React, { useState } from 'react';
import { IntervalSelectorProps } from '@/types';
import { INTERVAL_DISPLAY_NAMES, SUPPORTED_INTERVALS } from '@/utils/constants';

interface AdvancedIntervalSelectorProps extends IntervalSelectorProps {
  syncMode?: boolean;
  onSyncModeChange?: (enabled: boolean) => void;
  customIntervals?: string[];
  onCustomIntervalAdd?: (interval: string) => void;
}

const AdvancedIntervalSelector: React.FC<AdvancedIntervalSelectorProps> = ({
  selectedInterval,
  availableIntervals,
  onChange,
  syncMode = false,
  onSyncModeChange,
  customIntervals = [],
  onCustomIntervalAdd
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Group intervals by category for better organization
  const intervalCategories = {
    'Seconds': ['1s', '5s'],
    'Minutes': ['1m', '5m', '15m', '30m'],
    'Hours': ['1h', '2h', '4h', '6h', '8h', '12h'],
    'Days+': ['1d', '3d', '1w', '1M']
  };

  // All available intervals including customs (for future use)
  // const allIntervals = [...SUPPORTED_INTERVALS, ...customIntervals];

  const handleCustomIntervalSubmit = () => {
    if (customValue.trim() && onCustomIntervalAdd) {
      onCustomIntervalAdd(customValue.trim());
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  const getIntervalDisplayName = (interval: string): string => {
    return INTERVAL_DISPLAY_NAMES[interval as keyof typeof INTERVAL_DISPLAY_NAMES] || interval;
  };

  return (
    <div className="space-y-4">
      {/* Header with sync mode toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Timeframe:
        </label>
        <div className="flex items-center space-x-4">
          {/* Sync mode toggle */}
          {onSyncModeChange && (
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={syncMode}
                onChange={(e) => onSyncModeChange(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-600 dark:text-gray-400">Sync All Charts</span>
            </label>
          )}

          {/* Custom interval button */}
          {onCustomIntervalAdd && (
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              + Custom
            </button>
          )}
        </div>
      </div>

      {/* Custom interval input */}
      {showCustomInput && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g., 3m, 2h, 6d"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomIntervalSubmit()}
          />
          <button
            onClick={handleCustomIntervalSubmit}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Add
          </button>
          <button
            onClick={() => setShowCustomInput(false)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Standard intervals grouped by category */}
      <div className="space-y-3">
        {Object.entries(intervalCategories).map(([category, intervals]) => {
          const categoryIntervals = intervals.filter(interval =>
            availableIntervals.includes(interval)
          );

          if (categoryIntervals.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {category}
              </div>
              <div className="flex flex-wrap gap-1">
                {categoryIntervals.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => onChange(interval)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedInterval === interval
                        ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-600 ring-opacity-50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                    }`}
                    aria-pressed={selectedInterval === interval}
                  >
                    {getIntervalDisplayName(interval)}
                    {syncMode && selectedInterval === interval && (
                      <span className="ml-1 text-xs">🔗</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Custom intervals section */}
        {customIntervals.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Custom
            </div>
            <div className="flex flex-wrap gap-1">
              {customIntervals.map((interval) => (
                <button
                  key={interval}
                  onClick={() => onChange(interval)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    selectedInterval === interval
                      ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600 ring-opacity-50'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 hover:shadow-sm'
                  }`}
                  aria-pressed={selectedInterval === interval}
                >
                  {interval}
                  {syncMode && selectedInterval === interval && (
                    <span className="ml-1 text-xs">🔗</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick presets */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Quick Presets
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Scalping', intervals: ['1s', '5s', '1m'] },
            { label: 'Day Trading', intervals: ['5m', '15m', '1h'] },
            { label: 'Swing Trading', intervals: ['1h', '4h', '1d'] },
            { label: 'Long Term', intervals: ['1d', '1w', '1M'] }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                // For now, just select the middle interval of the preset
                const middleInterval = preset.intervals[Math.floor(preset.intervals.length / 2)];
                if (availableIntervals.includes(middleInterval)) {
                  onChange(middleInterval);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title={`Switch to ${preset.intervals.join(', ')}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info about current selection */}
      {selectedInterval && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
          <strong>Selected:</strong> {getIntervalDisplayName(selectedInterval)}
          {syncMode && <span className="ml-2">• Synced across all charts</span>}
        </div>
      )}
    </div>
  );
};

export default AdvancedIntervalSelector;