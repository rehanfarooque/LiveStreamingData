import React, { useState, useRef, useEffect } from 'react';
import { IntervalSelectorProps } from '@/types';
import { INTERVAL_DISPLAY_NAMES } from '@/utils/constants';
import { FaChevronDown, FaClock, FaCheckCircle } from 'react-icons/fa';

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

  // Group intervals by category for better organization - ensuring ALL intervals are included
  const groupedIntervals = {
    'Real-time': availableIntervals.filter(i => i.includes('s')), // Should include: 1s, 5s
    'Short-term': availableIntervals.filter(i => i.includes('m')), // Should include: 1m, 5m, 15m
    'Long-term': availableIntervals.filter(i => i.includes('h') || i.includes('d')) // Should include: 1h, 4h, 1d
  };

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center whitespace-nowrap">
        <FaClock className="w-4 h-4 mr-2 text-blue-500" />
        Timeframe:
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center justify-between min-w-[140px] px-4 py-2.5 
            bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700
            border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl
            text-sm font-semibold text-gray-800 dark:text-gray-200
            hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:border-blue-500 transition-all duration-300
            hover:scale-105 active:scale-95
          "
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">{selectedInterval}</span>
            <span className="text-gray-600 dark:text-gray-400 text-xs">({currentDisplayName})</span>
          </span>
          <FaChevronDown className={`w-3 h-3 ml-2 text-gray-500 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-blue-500' : 'rotate-0'
          }`} />
        </button>

        {isOpen && (
          <div className="
            absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 rounded-xl dropdown-glow
            z-50 max-h-96 overflow-y-auto scrollbar-thin animate-in slide-in-from-top-2 duration-300
          ">
            <div className="py-2">
              {Object.entries(groupedIntervals).map(([category, intervals]) => (
                intervals.length > 0 && (
                  <div key={category} className="mb-2">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                      {category} <span className="text-blue-500">({intervals.length})</span>
                    </div>
                    <div className="py-1">
                      {intervals.map((interval) => {
                        const displayName = INTERVAL_DISPLAY_NAMES[interval as keyof typeof INTERVAL_DISPLAY_NAMES] || interval;
                        const isSelected = selectedInterval === interval;
                        
                        return (
                          <button
                            key={interval}
                            onClick={() => handleIntervalSelect(interval)}
                            className={`
                              w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between
                              hover:bg-gradient-to-r group border-l-4
                              ${isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md border-l-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:from-blue-50 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border-l-transparent hover:border-l-blue-200'
                              }
                            `}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="flex flex-col">
                              <span className={`font-semibold text-sm ${
                                isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                              }`}>
                                {displayName}
                              </span>
                              <span className={`text-xs ${
                                isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {interval} interval
                              </span>
                            </div>
                            {isSelected && (
                              <FaCheckCircle className="w-4 h-4 text-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntervalSelector;