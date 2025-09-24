import { useState, useEffect, useCallback } from 'react';
import { TradingPair } from '@/types';
import { SUPPORTED_PAIRS } from '@/utils/constants';

interface URLParams {
  symbol?: string;
  interval?: string;
}

export const useURLParams = () => {
  const [urlParams, setUrlParams] = useState<URLParams>({});

  // Read URL parameters
  const readURLParams = useCallback((): URLParams => {
    const params = new URLSearchParams(window.location.search);
    return {
      symbol: params.get('symbol') || undefined,
      interval: params.get('interval') || undefined
    };
  }, []);

  // Update URL parameters
  const updateURLParams = useCallback((newParams: URLParams) => {
    const params = new URLSearchParams(window.location.search);
    
    if (newParams.symbol) {
      params.set('symbol', newParams.symbol);
    } else {
      params.delete('symbol');
    }
    
    if (newParams.interval) {
      params.set('interval', newParams.interval);
    } else {
      params.delete('interval');
    }

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newURL);
    
    setUrlParams(newParams);
  }, []);

  // Initialize URL parameters
  useEffect(() => {
    setUrlParams(readURLParams());
  }, [readURLParams]);

  return { urlParams, updateURLParams };
};

export const useURLBasedInitialization = () => {
  const [initialPair, setInitialPair] = useState<TradingPair | null>(null);
  const [initialInterval, setInitialInterval] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const symbolParam = urlParams.get('symbol');
    const intervalParam = urlParams.get('interval');

    // Check localStorage for initial values
    const storedSymbol = localStorage.getItem('crypto-dashboard-initial-symbol');
    const storedInterval = localStorage.getItem('crypto-dashboard-initial-interval');

    // Resolve initial pair
    const targetSymbol = symbolParam || storedSymbol;
    if (targetSymbol) {
      const pair = SUPPORTED_PAIRS.find(p => p.symbol === targetSymbol.toUpperCase());
      if (pair) {
        setInitialPair(pair);
      }
    }

    // Resolve initial interval
    const targetInterval = intervalParam || storedInterval;
    if (targetInterval) {
      setInitialInterval(targetInterval);
    }

    // Clean up localStorage
    localStorage.removeItem('crypto-dashboard-initial-symbol');
    localStorage.removeItem('crypto-dashboard-initial-interval');
  }, []);

  return { initialPair, initialInterval };
};