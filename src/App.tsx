import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  WebSocketProvider,
  ChartDataProvider,
  UserPreferencesProvider
} from '@/contexts';

function App() {
  useEffect(() => {
    // Set document title
    document.title = 'Multi-Product Crypto Trading Dashboard | Real-time Data';
    
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
    const handlePopState = () => {
      // Handle back/forward navigation and trigger re-render
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
              <EnhancedDashboard />
            </Layout>
          </ChartDataProvider>
        </WebSocketProvider>
      </UserPreferencesProvider>
    </ErrorBoundary>
  );
}

export default App;