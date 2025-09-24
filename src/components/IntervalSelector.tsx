import React, { useState, useRef, useEffect } from 'react';
import { IntervalSelectorProps } from '@/types';
import { INTERVAL_DISPLAY_NAMES } from '@/utils/constants';
import { FaChevronDown, FaClock } from 'react-icons/fa';

const IntervalSelector: React.FC<IntervalSelectorProps> = ({
  selectedInterval,
  availableIntervals,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIntervalSelect = (interval: string) => {
    onChange(interval);
    setIsOpen(false);
  };

  const currentDisplayName = INTERVAL_DISPLAY_NAMES[selectedInterval as keyof typeof INTERVAL_DISPLAY_NAMES] || selectedInterval;

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
        <FaClock className="w-4 h-4 mr-1.5" />
        Timeframe:
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center justify-between w-24 px-3 py-2 bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
            text-sm font-medium text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
          "
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">{currentDisplayName}</span>
          <FaChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`} />
        </button>

        {isOpen && (
          <div className="
            absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg
            z-50 max-h-64 overflow-y-auto
          ">
            <div className="py-1">
              {availableIntervals.map((interval) => {
                const displayName = INTERVAL_DISPLAY_NAMES[interval as keyof typeof INTERVAL_DISPLAY_NAMES] || interval;
                const isSelected = selectedInterval === interval;
                
                return (
                  <button
                    key={interval}
                    onClick={() => handleIntervalSelect(interval)}
                    className={`
                      w-full px-3 py-2 text-left text-sm transition-colors duration-150
                      ${isSelected
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="font-medium">{displayName}</span>
                    {interval.includes('s') && (
                      <span className="text-xs opacity-75 ml-1">(seconds)</span>
                    )}
                    {interval.includes('m') && (
                      <span className="text-xs opacity-75 ml-1">(minutes)</span>
                    )}
                    {interval.includes('h') && (
                      <span className="text-xs opacity-75 ml-1">(hours)</span>
                    )}
                    {interval.includes('d') && (
                      <span className="text-xs opacity-75 ml-1">(days)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntervalSelector;