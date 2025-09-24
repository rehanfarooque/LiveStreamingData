import React, { useState, useEffect, useMemo } from 'react';
import { TradingPair } from '@/types';
import { SUPPORTED_PAIRS } from '@/utils/constants';

// interface WatchlistItem extends TradingPair {
//   isFavorite: boolean;
//   category?: string;
// }

interface ProductWatchlistProps {
  onProductSelect: (pair: TradingPair) => void;
  selectedProduct?: string;
}

const ProductWatchlist: React.FC<ProductWatchlistProps> = ({
  onProductSelect,
  selectedProduct
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('crypto-favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  // Categorize products
  const categorizedProducts = useMemo(() => {
    const categories: Record<string, TradingPair[]> = {
      'Major': [],
      'DeFi': [],
      'Layer1': [],
      'Meme': [],
      'Gaming': [],
      'AI': [],
      'Other': []
    };

    SUPPORTED_PAIRS.forEach(pair => {
      const symbol = pair.baseAsset.toLowerCase();

      if (['btc', 'eth', 'bnb'].includes(symbol)) {
        categories.Major.push(pair);
      } else if (['aave', 'mkr', 'comp', 'crv', 'uni'].includes(symbol)) {
        categories.DeFi.push(pair);
      } else if (['sol', 'ada', 'dot', 'atom', 'near', 'algo', 'ftm'].includes(symbol)) {
        categories.Layer1.push(pair);
      } else if (['doge', 'shib', 'pepe'].includes(symbol)) {
        categories.Meme.push(pair);
      } else if (['sand', 'mana', 'axs'].includes(symbol)) {
        categories.Gaming.push(pair);
      } else if (['fet', 'ocean'].includes(symbol)) {
        categories.AI.push(pair);
      } else {
        categories.Other.push(pair);
      }
    });

    return categories;
  }, []);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let products = SUPPORTED_PAIRS;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        products = products.filter(pair => favorites.has(pair.symbol));
      } else {
        products = categorizedProducts[selectedCategory] || [];
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(pair =>
        pair.symbol.toLowerCase().includes(query) ||
        pair.displayName.toLowerCase().includes(query) ||
        pair.baseAsset.toLowerCase().includes(query)
      );
    }

    return products.map(pair => ({
      ...pair,
      isFavorite: favorites.has(pair.symbol)
    }));
  }, [searchQuery, selectedCategory, favorites, categorizedProducts]);

  // Toggle favorite
  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const updated = new Set(prev);
      if (updated.has(symbol)) {
        updated.delete(symbol);
      } else {
        updated.add(symbol);
      }

      // Save to localStorage
      try {
        localStorage.setItem('crypto-favorites', JSON.stringify(Array.from(updated)));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }

      return updated;
    });
  };

  const categories = [
    { id: 'all', name: 'All Products', count: SUPPORTED_PAIRS.length },
    { id: 'favorites', name: 'Favorites', count: favorites.size },
    { id: 'Major', name: 'Major Coins', count: categorizedProducts.Major.length },
    { id: 'DeFi', name: 'DeFi', count: categorizedProducts.DeFi.length },
    { id: 'Layer1', name: 'Layer 1', count: categorizedProducts.Layer1.length },
    { id: 'Meme', name: 'Meme Coins', count: categorizedProducts.Meme.length },
    { id: 'Gaming', name: 'Gaming', count: categorizedProducts.Gaming.length },
    { id: 'AI', name: 'AI & Data', count: categorizedProducts.AI.length },
    { id: 'Other', name: 'Other', count: categorizedProducts.Other.length }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Product Watchlist
        </h3>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No products found' : 'No products in this category'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product) => (
              <div
                key={product.symbol}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProduct === product.symbol
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onProductSelect(product)}
              >
                <div className="flex items-center space-x-3">
                  {/* Crypto Icon Placeholder */}
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {product.baseAsset.charAt(0)}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {product.baseAsset}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {product.displayName.split(' / ')[0]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {product.quoteAsset}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.symbol);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                      product.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={product.isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductWatchlist;