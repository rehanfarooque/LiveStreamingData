import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  WebSocketProvider,
  ChartDataProvider,
  UserPreferencesProvider
} from '@/contexts';

function App() {
  useEffect(() => {
    // Set document title
    document.title = 'Crypto Chart Dashboard';
    
    // Handle URL parameters for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    const interval = urlParams.get('interval');
    
    if (symbol || interval) {
      // Store URL parameters in localStorage for initial load
      if (symbol) {
        localStorage.setItem('crypto-dashboard-initial-symbol', symbol.toUpperCase());
      }
      if (interval) {
        localStorage.setItem('crypto-dashboard-initial-interval', interval);
      }
    }

    // Cleanup function
    return () => {
      // Clean up any URL parameter storage on unmount
      localStorage.removeItem('crypto-dashboard-initial-symbol');
      localStorage.removeItem('crypto-dashboard-initial-interval');
    };
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Handle back/forward navigation
      const urlParams = new URLSearchParams(window.location.search);
      const symbol = urlParams.get('symbol');
      const interval = urlParams.get('interval');
      
      // Trigger re-render with new parameters
      window.location.reload();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <ErrorBoundary>
      <UserPreferencesProvider>
        <WebSocketProvider>
          <ChartDataProvider>
            <Layout>
              <Dashboard />
            </Layout>
          </ChartDataProvider>
        </WebSocketProvider>
      </UserPreferencesProvider>
    </ErrorBoundary>
  );
}

export default App;