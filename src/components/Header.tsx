import React from 'react';
import { FaBitcoin } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useUserPreferences, useWebSocket } from '@/contexts';

const Header: React.FC = () => {
  const { theme, setTheme } = useUserPreferences();
  const { isConnected, connectionStatus } = useWebSocket();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Streaming';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Disconnected';
      default:
        return 'Offline';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <FaBitcoin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Crypto Chart Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time cryptocurrency tracking
              </p>
            </div>
          </div>

          {/* Theme toggle and status */}
          <div className="flex items-center space-x-4">
            {/* Connection status indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getConnectionStatusText()}
              </span>
            </div>

            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <MdDarkMode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <MdLightMode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;