# Crypto Chart Dashboard

A modern, real-time cryptocurrency chart dashboard built with React, TypeScript, and Binance API integration. Features interactive candlestick and line charts with live data streaming via WebSocket connections.

## Features

### 🚀 Core Functionality
- **Real-time Price Tracking**: Live cryptocurrency price updates via Binance WebSocket API
- **Interactive Charts**: Candlestick and line chart visualization using Chart.js
- **Multiple Trading Pairs**: Support for BTC/USDT and ETH/USDT with easy extensibility
- **Multiple Timeframes**: 1s, 5s, 1m, 5m, 15m, 1h, 4h, 1d intervals
- **Market Statistics**: 24h price change, volume, and percentage change indicators

### 🎨 User Experience
- **Dark/Light Theme**: Automatic system theme detection with manual toggle
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Deep Linking**: URL parameters for sharing specific pair/interval combinations
- **Error Boundaries**: Graceful error handling and recovery
- **Loading States**: Smooth loading indicators and skeleton screens

### ⚡ Performance
- **WebSocket Auto-reconnection**: Intelligent reconnection with exponential backoff
- **Data Throttling**: Optimized update rates to prevent UI blocking
- **Memory Management**: Automatic cleanup of old data points
- **Bundle Optimization**: Code splitting and tree shaking for minimal bundle size

## Technology Stack

### Frontend Framework
- **React 18+** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server

### Charting & Visualization
- **Chart.js** - Canvas-based charting library
- **chartjs-chart-financial** - Financial chart plugins for candlestick charts
- **chartjs-adapter-date-fns** - Time scale adapter

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Accessible, unstyled UI components
- **React Icons** - Comprehensive icon library
- **Heroicons** - SVG icon library

### API & Data Management
- **Axios** - HTTP client for REST API calls
- **Native WebSocket API** - Real-time data streaming
- **Custom Context API** - State management solution

## Project Structure

```
src/
├── components/           # React components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Header.tsx       # Application header
│   ├── Footer.tsx       # Application footer
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── ControlPanel.tsx # Chart controls
│   ├── PriceChart.tsx   # Chart.js integration
│   ├── MarketInfo.tsx   # Market statistics display
│   ├── PairSelector.tsx # Trading pair selector
│   ├── IntervalSelector.tsx # Timeframe selector
│   ├── ChartTypeToggle.tsx # Chart type toggle
│   └── ErrorBoundary.tsx # Error handling
├── contexts/            # React Context providers
│   ├── WebSocketContext.tsx # WebSocket management
│   ├── ChartDataContext.tsx # Chart data state
│   └── UserPreferencesContext.tsx # User settings
├── services/           # External service integrations
│   ├── binanceApi.ts   # Binance REST API client
│   └── websocketManager.ts # WebSocket connection manager
├── hooks/              # Custom React hooks
│   ├── useURLParams.ts # URL parameter management
│   └── usePerformance.ts # Performance optimization hooks
├── types/              # TypeScript type definitions
│   └── index.ts        # All interface definitions
├── utils/              # Utility functions
│   ├── constants.ts    # Application constants
│   └── helpers.ts      # Helper functions
└── index.css          # Global styles and Tailwind imports
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with WebSocket support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-chart-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Configuration

### Supported Trading Pairs
Currently supports:
- BTC/USDT (Bitcoin/Tether)
- ETH/USDT (Ethereum/Tether)

Add more pairs in `src/utils/constants.ts`:

```typescript
export const SUPPORTED_PAIRS: TradingPair[] = [
  // ... existing pairs
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    displayName: 'Cardano / USDT'
  }
];
```

### Timeframe Configuration
Modify `SUPPORTED_INTERVALS` in `src/utils/constants.ts` to add/remove timeframes.

### Performance Tuning
Adjust settings in `src/utils/constants.ts`:

```typescript
export const CHART_CONFIG = {
  MAX_DATA_POINTS: 500,        // Maximum chart data points
  UPDATE_THROTTLE_MS: 100,     // Update throttling
  ANIMATION_DURATION: 300,     // Chart animations
  RETENTION_WINDOW_HOURS: 24,  // Data retention
  DEFAULT_CANDLE_LIMIT: 200    // Initial data fetch limit
};
```

## API Integration

### Binance REST API
- **Endpoint**: `https://api.binance.com`
- **Kline Data**: `/api/v3/klines`
- **24hr Statistics**: `/api/v3/ticker/24hr`
- **Current Price**: `/api/v3/ticker/price`

### Binance WebSocket API
- **Endpoint**: `wss://stream.binance.com:9443/ws/`
- **Stream Format**: `{symbol}@kline_{interval}`
- **Auto-reconnection**: Exponential backoff strategy

### Rate Limiting
The application implements:
- Request throttling for API calls
- WebSocket message batching
- Automatic retry with backoff

## Browser Support

### Minimum Requirements
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Features Used
- ES2020 features
- WebSocket API
- Canvas API (Chart.js)
- CSS Grid and Flexbox
- Local Storage API

## Development

### Code Quality
- TypeScript for type safety
- ESLint configuration
- Consistent code formatting
- Component-based architecture

### Performance Considerations
- React.memo for component optimization
- useCallback for function memoization
- Throttled WebSocket updates
- Lazy loading capabilities

### Error Handling
- Error boundaries for component errors
- WebSocket reconnection logic
- API error recovery
- User-friendly error messages

## Deployment

### Environment Variables
Create `.env` file if needed:
```
VITE_API_BASE_URL=https://api.binance.com
VITE_WS_BASE_URL=wss://stream.binance.com:9443/ws/
```

### Build Optimization
The production build includes:
- Code minification
- Tree shaking
- Asset optimization
- Source maps for debugging

### Hosting
Compatible with:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Update documentation

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Binance API** - Real-time cryptocurrency data
- **Chart.js** - Powerful charting library
- **Tailwind CSS** - Utility-first CSS framework
- **React Community** - Excellent ecosystem and tools

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check internet connection
- Verify Binance API access
- Check browser console for errors

**Chart Not Updating**
- Verify WebSocket connection status
- Check browser developer tools
- Ensure JavaScript is enabled

**Performance Issues**
- Reduce MAX_DATA_POINTS in configuration
- Increase UPDATE_THROTTLE_MS
- Check browser memory usage

### Getting Help
- Check browser console for errors
- Review network tab for API issues
- Ensure all dependencies are installed
- Verify Node.js version compatibility

---

Built with ❤️ using React, TypeScript, and Binance API