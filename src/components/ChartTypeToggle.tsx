import React, { useState, useRef, useEffect } from 'react';
import { FaChartLine, FaChartBar, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import { BsBarChart } from 'react-icons/bs';

interface ChartTypeToggleProps {
  chartType: 'candlestick' | 'line' | 'ohlc';
  onChange: (type: 'candlestick' | 'line' | 'ohlc') => void;
}

const ChartTypeToggle: React.FC<ChartTypeToggleProps> = ({ chartType, onChange }) => {
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

  const chartTypes = [
    { 
      type: 'candlestick' as const, 
      icon: FaChartBar, 
      label: 'Candlestick',
      description: 'Traditional OHLC candles with body and wicks'
    },
    { 
      type: 'line' as const, 
      icon: FaChartLine, 
      label: 'Line Chart',
      description: 'Simple line connecting closing prices'
    },
    { 
      type: 'ohlc' as const, 
      icon: BsBarChart, 
      label: 'OHLC Bar',
      description: 'Bar chart showing open, high, low, close'
    }
  ];

  const currentChartType = chartTypes.find(ct => ct.type === chartType) || chartTypes[0];

  const handleChartTypeSelect = (type: 'candlestick' | 'line' | 'ohlc') => {
    onChange(type);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center whitespace-nowrap">
        <FaChartBar className="w-4 h-4 mr-2 text-green-500" />
        Chart Type:
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center justify-between min-w-[160px] px-4 py-2.5 
            bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700
            border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg hover:shadow-xl
            text-sm font-semibold text-gray-800 dark:text-gray-200
            hover:border-green-400 dark:hover:border-green-500 focus:outline-none focus:ring-2
            focus:ring-green-500 focus:border-green-500 transition-all duration-300
            hover:scale-105 active:scale-95
          "
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center">
            <currentChartType.icon className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
            <span className="text-gray-800 dark:text-gray-200">{currentChartType.label}</span>
          </span>
          <FaChevronDown className={`w-3 h-3 ml-2 text-gray-500 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-green-500' : 'rotate-0'
          }`} />
        </button>

        {isOpen && (
          <div className="
            absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 rounded-xl dropdown-glow-green
            z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300
          ">
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                Select Chart Visualization
              </div>
              {chartTypes.map(({ type, icon: Icon, label, description }) => {
                const isSelected = chartType === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleChartTypeSelect(type)}
                    className={`
                      w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between
                      hover:bg-gradient-to-r group
                      ${isSelected
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:from-green-50 hover:to-green-100 dark:hover:from-gray-700 dark:hover:to-gray-600'
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-3 ${
                        isSelected ? 'text-white' : 'text-green-600 dark:text-green-400'
                      }`} />
                      <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${
                          isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {label}
                        </span>
                        <span className={`text-xs ${
                          isSelected ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <FaCheckCircle className="w-4 h-4 text-white" />
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

export default ChartTypeToggle;