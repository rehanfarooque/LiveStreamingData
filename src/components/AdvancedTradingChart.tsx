import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { CandlestickData } from '@/types';

export type ChartType = 'candlestick' | 'line' | 'area' | 'bar' | 'volume';

interface AdvancedTradingChartProps {
  data: CandlestickData[];
  symbol: string;
  chartType: ChartType;
  isLoading: boolean;
  interval: string;
  height?: number;
  showVolume?: boolean;
  showMA?: boolean;
  showGrid?: boolean;
}

interface DrawingContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  chartArea: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  priceScale: {
    min: number;
    max: number;
    pixelsPerUnit: number;
  };
  timeScale: {
    startTime: number;
    endTime: number;
    pixelsPerMs: number;
  };
}

const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  data,
  symbol,
  chartType,
  isLoading,
  interval,
  height = 400,
  showVolume = true,
  showMA = true,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [crosshairData, setCrosshairData] = useState<CandlestickData | null>(null);

  // BINANCE-STYLE COLOR SCHEME
  const colors = {
    bull: '#0ECB81', // Binance green
    bear: '#F6465D', // Binance red
    background: '#0B0E11', // Binance dark background
    grid: '#2B2F36',
    text: '#EAECEF',
    border: '#2B2F36',
    volume: 'rgba(240, 185, 11, 0.3)', // Binance yellow volume
    crosshair: '#F0B90B', // Binance yellow
    ma7: '#FFD700', // Gold for 7-period MA
    ma25: '#FF6B35', // Orange for 25-period MA
    ma99: '#6B73FF' // Blue for 99-period MA
  };

  // Calculate moving averages
  const calculateMA = useCallback((period: number): number[] => {
    if (!data || data.length < period) return [];

    const maData: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      maData.push(sum / period);
    }
    return maData;
  }, [data]);

  // Calculate MA data
  const ma7 = useMemo(() => calculateMA(7), [calculateMA]);
  const ma25 = useMemo(() => calculateMA(25), [calculateMA]);
  const ma99 = useMemo(() => calculateMA(99), [calculateMA]);

  // Calculate drawing context with proper scaling
  const calculateDrawingContext = useCallback((canvas: HTMLCanvasElement): DrawingContext | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !data || data.length === 0) return null;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const padding = { left: 80, right: 80, top: 20, bottom: 60 };
    const chartArea = {
      left: padding.left,
      right: canvas.width / devicePixelRatio - padding.right,
      top: padding.top,
      bottom: canvas.height / devicePixelRatio - padding.bottom
    };

    // Calculate price scale
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const paddedMin = minPrice - priceRange * 0.05;
    const paddedMax = maxPrice + priceRange * 0.05;
    const chartHeight = chartArea.bottom - chartArea.top;

    // Calculate time scale
    const startTime = data[0].timestamp;
    const endTime = data[data.length - 1].timestamp + (data[1]?.timestamp - data[0].timestamp || 60000);
    const timeRange = endTime - startTime;
    const chartWidth = chartArea.right - chartArea.left;

    return {
      ctx,
      width: canvas.width / devicePixelRatio,
      height: canvas.height / devicePixelRatio,
      chartArea,
      priceScale: {
        min: paddedMin,
        max: paddedMax,
        pixelsPerUnit: chartHeight / (paddedMax - paddedMin)
      },
      timeScale: {
        startTime,
        endTime,
        pixelsPerMs: chartWidth / timeRange
      }
    };
  }, [data]);

  // Convert price to Y coordinate
  const priceToY = useCallback((price: number, drawCtx: DrawingContext): number => {
    return drawCtx.chartArea.bottom - (price - drawCtx.priceScale.min) * drawCtx.priceScale.pixelsPerUnit;
  }, []);

  // Convert timestamp to X coordinate
  const timeToX = useCallback((timestamp: number, drawCtx: DrawingContext): number => {
    return drawCtx.chartArea.left + (timestamp - drawCtx.timeScale.startTime) * drawCtx.timeScale.pixelsPerMs;
  }, []);

  // Draw grid lines
  const drawGrid = useCallback((drawCtx: DrawingContext) => {
    if (!showGrid) return;

    const { ctx, chartArea, priceScale, timeScale } = drawCtx;

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    // Horizontal price lines
    const priceStep = (priceScale.max - priceScale.min) / 8;
    for (let i = 0; i <= 8; i++) {
      const price = priceScale.min + i * priceStep;
      const y = priceToY(price, drawCtx);

      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();

      // Price labels on right side (Binance style)
      ctx.fillStyle = colors.text;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      const priceText = price < 1 ? price.toFixed(6) : price < 10 ? price.toFixed(4) : price.toFixed(2);
      ctx.fillText(`$${priceText}`, chartArea.right + 8, y + 4);
    }

    // Vertical time lines
    const timeStep = (timeScale.endTime - timeScale.startTime) / 6;
    for (let i = 0; i <= 6; i++) {
      const time = timeScale.startTime + i * timeStep;
      const x = timeToX(time, drawCtx);

      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();

      // Time labels on bottom (Binance style)
      ctx.fillStyle = colors.text;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      const date = new Date(time);
      const timeStr = interval.includes('s') ?
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, chartArea.bottom + 15);
    }
  }, [priceToY, timeToX, colors, interval, showGrid]);

  // Draw moving averages
  const drawMovingAverages = useCallback((drawCtx: DrawingContext) => {
    if (!showMA || data.length < 25) return;

    const { ctx } = drawCtx;

    const drawMA = (maData: number[], color: string, period: number) => {
      if (maData.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();

      maData.forEach((ma, index) => {
        const dataIndex = index + period - 1;
        if (dataIndex >= data.length) return;

        const x = timeToX(data[dataIndex].timestamp, drawCtx);
        const y = priceToY(ma, drawCtx);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    };

    // Draw MA lines
    drawMA(ma7, colors.ma7, 7);
    drawMA(ma25, colors.ma25, 25);
    drawMA(ma99, colors.ma99, 99);
  }, [data, ma7, ma25, ma99, timeToX, priceToY, colors, showMA]);

  // Draw candlestick chart
  const drawCandlesticks = useCallback((drawCtx: DrawingContext) => {
    const { ctx } = drawCtx;
    const candleWidth = Math.max(2, (drawCtx.chartArea.right - drawCtx.chartArea.left) / data.length * 0.8);

    data.forEach((candle, index) => {
      const x = timeToX(candle.timestamp, drawCtx);
      const openY = priceToY(candle.open, drawCtx);
      const closeY = priceToY(candle.close, drawCtx);
      const highY = priceToY(candle.high, drawCtx);
      const lowY = priceToY(candle.low, drawCtx);

      const isBull = candle.close >= candle.open;
      const color = isBull ? colors.bull : colors.bear;

      // Draw wick (high-low line)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body (open-close rectangle)
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);

      if (isBull) {
        ctx.fillStyle = colors.bull;
        ctx.strokeStyle = colors.bull;
      } else {
        ctx.fillStyle = colors.bear;
        ctx.strokeStyle = colors.bear;
      }

      // Fill body
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, Math.max(1, bodyHeight));

      // Stroke body outline
      ctx.lineWidth = 1;
      ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, Math.max(1, bodyHeight));
    });
  }, [data, timeToX, priceToY, colors]);

  // Draw line chart
  const drawLine = useCallback((drawCtx: DrawingContext) => {
    if (data.length < 2) return;

    const { ctx } = drawCtx;

    ctx.strokeStyle = colors.bull;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((candle, index) => {
      const x = timeToX(candle.timestamp, drawCtx);
      const y = priceToY(candle.close, drawCtx);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [data, timeToX, priceToY, colors]);

  // Draw area chart
  const drawArea = useCallback((drawCtx: DrawingContext) => {
    if (data.length < 2) return;

    const { ctx, chartArea } = drawCtx;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `${colors.bull}40`);
    gradient.addColorStop(1, `${colors.bull}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Start from bottom left
    const firstX = timeToX(data[0].timestamp, drawCtx);
    ctx.moveTo(firstX, chartArea.bottom);

    // Draw line to first point
    ctx.lineTo(firstX, priceToY(data[0].close, drawCtx));

    // Draw the line
    data.forEach((candle, index) => {
      const x = timeToX(candle.timestamp, drawCtx);
      const y = priceToY(candle.close, drawCtx);
      ctx.lineTo(x, y);
    });

    // Close the path
    const lastX = timeToX(data[data.length - 1].timestamp, drawCtx);
    ctx.lineTo(lastX, chartArea.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw the line on top
    drawLine(drawCtx);
  }, [data, timeToX, priceToY, drawLine, colors]);

  // Draw volume bars (enhanced for better visibility)
  const drawVolume = useCallback((drawCtx: DrawingContext) => {
    if (data.length === 0 || chartType === 'volume') return;

    const { ctx, chartArea } = drawCtx;
    const maxVolume = Math.max(...data.map(d => d.volume));
    if (maxVolume === 0) return;

    const volumeHeight = showVolume ? (chartArea.bottom - chartArea.top) * 0.15 : 0;
    const volumeBottom = chartArea.bottom;
    const barWidth = Math.max(1, (chartArea.right - chartArea.left) / data.length * 0.7);

    data.forEach((candle) => {
      const x = timeToX(candle.timestamp, drawCtx);
      const height = (candle.volume / maxVolume) * volumeHeight;
      const y = volumeBottom - height;

      const isBull = candle.close >= candle.open;
      const alpha = showVolume ? '80' : '30';
      ctx.fillStyle = isBull ? `${colors.bull}${alpha}` : `${colors.bear}${alpha}`;
      ctx.fillRect(x - barWidth / 2, y, barWidth, height);
    });

    // Volume scale labels (only if showing volume)
    if (showVolume && maxVolume > 0) {
      ctx.fillStyle = colors.text;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';

      const formatVolume = (vol: number) => {
        if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
        if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
        return vol.toFixed(0);
      };

      ctx.fillText(`Vol: ${formatVolume(maxVolume)}`, chartArea.left, chartArea.bottom - volumeHeight - 5);
    }
  }, [data, timeToX, colors, chartType, showVolume]);

  // Draw crosshair
  const drawCrosshair = useCallback((drawCtx: DrawingContext) => {
    if (!isHovering) return;

    const { ctx, chartArea } = drawCtx;

    ctx.strokeStyle = colors.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mousePosition.x, chartArea.top);
    ctx.lineTo(mousePosition.x, chartArea.bottom);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(chartArea.left, mousePosition.y);
    ctx.lineTo(chartArea.right, mousePosition.y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Price label
    if (crosshairData) {
      const priceY = priceToY(crosshairData.close, drawCtx);
      ctx.fillStyle = colors.crosshair;
      ctx.fillRect(chartArea.right + 5, priceY - 10, 70, 20);
      ctx.fillStyle = colors.background;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(crosshairData.close.toFixed(crosshairData.close < 1 ? 6 : 2), chartArea.right + 40, priceY + 4);
    }
  }, [isHovering, mousePosition, crosshairData, priceToY, colors]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = calculateDrawingContext(canvas);
    if (!drawCtx) return;

    const { ctx } = drawCtx;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, drawCtx.width, drawCtx.height);

    // Draw grid
    drawGrid(drawCtx);

    // Draw volume first (background layer)
    if (chartType !== 'volume') {
      drawVolume(drawCtx);
    }

    // Draw chart based on type
    switch (chartType) {
      case 'candlestick':
        drawCandlesticks(drawCtx);
        drawMovingAverages(drawCtx); // Add MA overlay
        break;
      case 'line':
        drawLine(drawCtx);
        drawMovingAverages(drawCtx); // Add MA overlay
        break;
      case 'area':
        drawArea(drawCtx);
        drawMovingAverages(drawCtx); // Add MA overlay
        break;
      case 'volume':
        // Full-screen volume for dedicated volume chart
        const { ctx, chartArea } = drawCtx;
        const maxVolume = Math.max(...data.map(d => d.volume));
        const barWidth = Math.max(1, (chartArea.right - chartArea.left) / data.length * 0.8);

        data.forEach((candle) => {
          const x = timeToX(candle.timestamp, drawCtx);
          const height = (candle.volume / maxVolume) * (chartArea.bottom - chartArea.top);
          const y = chartArea.bottom - height;

          const isBull = candle.close >= candle.open;
          ctx.fillStyle = isBull ? colors.bull : colors.bear;
          ctx.fillRect(x - barWidth / 2, y, barWidth, height);
        });
        break;
      case 'bar':
        drawCandlesticks(drawCtx);
        drawMovingAverages(drawCtx); // Add MA overlay
        break;
    }

    // Draw crosshair (top layer)
    drawCrosshair(drawCtx);

  }, [data, chartType, calculateDrawingContext, drawGrid, drawCandlesticks, drawLine, drawArea, drawVolume, drawMovingAverages, drawCrosshair, timeToX, priceToY, colors]);

  // Handle mouse events
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMousePosition({ x, y });

    // Find closest data point
    const drawCtx = calculateDrawingContext(canvas);
    if (!drawCtx) return;

    let closestDistance = Infinity;
    let closestCandle: CandlestickData | null = null;

    data.forEach((candle) => {
      const candleX = timeToX(candle.timestamp, drawCtx);
      const distance = Math.abs(x - candleX);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCandle = candle;
      }
    });

    setCrosshairData(closestCandle);
  }, [data, calculateDrawingContext, timeToX]);

  // Animation loop for smooth updates
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (parent) {
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${height}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: `${height}px`, backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p style={{ color: colors.text }}>Loading professional chart...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: `${height}px`, backgroundColor: colors.background }}
      >
        <div className="text-center">
          <p style={{ color: colors.text }}>No data available for {symbol}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ backgroundColor: colors.background }}>
      {/* Chart Header */}
      <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold" style={{ color: colors.text }}>{symbol}</h3>
          <span className="text-sm" style={{ color: colors.text }}>{interval}</span>
          <span className="text-sm" style={{ color: colors.text }}>{chartType}</span>
        </div>
        <div className="flex items-center space-x-6">
          {/* Current/Crosshair OHLCV */}
          {crosshairData ? (
            <div className="flex space-x-3 text-sm" style={{ color: colors.text }}>
              <span className="font-mono">O: <span className="text-yellow-400">{crosshairData.open.toFixed(crosshairData.open < 1 ? 6 : 2)}</span></span>
              <span className="font-mono">H: <span style={{ color: colors.bull }}>{crosshairData.high.toFixed(crosshairData.high < 1 ? 6 : 2)}</span></span>
              <span className="font-mono">L: <span style={{ color: colors.bear }}>{crosshairData.low.toFixed(crosshairData.low < 1 ? 6 : 2)}</span></span>
              <span className="font-mono">C: <span className="text-white font-bold">{crosshairData.close.toFixed(crosshairData.close < 1 ? 6 : 2)}</span></span>
              <span className="font-mono">V: <span style={{ color: colors.volume.replace('0.3)', '1)') }}>{(crosshairData.volume / 1000).toFixed(1)}K</span></span>
            </div>
          ) : data && data.length > 0 && (
            <div className="flex space-x-3 text-sm" style={{ color: colors.text }}>
              <span className="font-mono">Current: <span className="text-white font-bold">${data[data.length - 1].close.toFixed(data[data.length - 1].close < 1 ? 6 : 2)}</span></span>
            </div>
          )}

          {/* Moving Averages */}
          {showMA && data && data.length >= 99 && (
            <div className="flex space-x-3 text-xs">
              <span className="font-mono">MA(7): <span style={{ color: colors.ma7 }}>{ma7[ma7.length - 1]?.toFixed(ma7[ma7.length - 1] < 1 ? 6 : 2) || 'N/A'}</span></span>
              <span className="font-mono">MA(25): <span style={{ color: colors.ma25 }}>{ma25[ma25.length - 1]?.toFixed(ma25[ma25.length - 1] < 1 ? 6 : 2) || 'N/A'}</span></span>
              <span className="font-mono">MA(99): <span style={{ color: colors.ma99 }}>{ma99[ma99.length - 1]?.toFixed(ma99[ma99.length - 1] < 1 ? 6 : 2) || 'N/A'}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
    </div>
  );
};

export default AdvancedTradingChart;