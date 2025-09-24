import React, { useRef, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  InteractionItem
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { ChartProps, CandlestickData } from '@/types';
import { COLORS } from '@/utils/constants';
import { formatPrice, formatTimestamp } from '@/utils/helpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
);

interface PriceChartProps extends ChartProps {
  symbol: string;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  chartType,
  isLoading,
  symbol,
  onZoomChange
}) => {
  const chartRef = useRef<ChartJS>(null);

  // Transform data for Chart.js - memoized to prevent unnecessary recalculations
  const chartData = useMemo((): ChartData<'candlestick' | 'line'> => {
    // Handle empty data case in memoized function
    const safeData = data || [];

    if (chartType === 'line') {
      return {
        labels: safeData.map(item => new Date(item.timestamp)),
        datasets: [{
          label: `${symbol} Price`,
          data: safeData.map(item => ({
            x: item.timestamp,
            y: item.close
          })),
          borderColor: COLORS.BULL,
          backgroundColor: `${COLORS.BULL}20`,
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: COLORS.BULL,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      };
    } else {
      return {
        labels: safeData.map(item => new Date(item.timestamp)),
        datasets: [{
          label: symbol,
          data: safeData.map(item => ({
            x: item.timestamp,
            o: item.open,
            h: item.high,
            l: item.low,
            c: item.close
          })),
          borderColor: (ctx: any) => {
            const { o, c } = ctx.parsed;
            return c >= o ? COLORS.BULL : COLORS.BEAR;
          },
          backgroundColor: (ctx: any) => {
            const { o, c } = ctx.parsed;
            return c >= o ? `${COLORS.BULL}80` : `${COLORS.BEAR}80`;
          },
          borderWidth: 1,
          borderSkipped: false
        }]
      };
    }
  }, [data, chartType, symbol]);

  // Chart configuration - memoized to prevent recreating on every render
  const chartOptions: ChartOptions<'candlestick' | 'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (context[0]) {
              return formatTimestamp(context[0].parsed.x, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            }
            return '';
          },
          label: (context) => {
            if (chartType === 'line') {
              return `Price: $${formatPrice(context.parsed.y)}`;
            } else {
              const data = context.raw as any;
              return [
                `Open: $${formatPrice(data.o)}`,
                `High: $${formatPrice(data.h)}`,
                `Low: $${formatPrice(data.l)}`,
                `Close: $${formatPrice(data.c)}`
              ];
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
            month: 'MMM yyyy'
          }
        },
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          callback: function(value) {
            return `$${formatPrice(value as number)}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4
      }
    },
    animation: {
      duration: 0 // No animation for TradingView-like instant updates
    },
    transitions: {
      active: {
        animation: {
          duration: 0
        }
      }
    },
    onHover: (event, activeElements) => {
      if (event.native?.target) {
        (event.native.target as HTMLElement).style.cursor =
          activeElements.length > 0 ? 'crosshair' : 'default';
      }
    }
  }), [chartType, symbol]);

  // Handle zoom changes - stable hook execution
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onZoomChange) return;

    const handleZoom = () => {
      const { min, max } = chart.scales.x;
      if (min && max) {
        const zoomLevel = (max - min) / (1000 * 60 * 60 * 24); // Days
        onZoomChange(zoomLevel);
      }
    };

    chart.canvas.addEventListener('wheel', handleZoom);
    return () => {
      if (chart.canvas) {
        chart.canvas.removeEventListener('wheel', handleZoom);
      }
    };
  }, [onZoomChange]);

  // Force re-render when data changes - memoized logging
  useEffect(() => {
    if (data && data.length > 0) {
      console.log(`📊 Chart data updated for ${symbol}:`, data.length, 'candles');
      console.log('Last candle:', data[data.length - 1]);
    }
  }, [data, symbol]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Render loading state
  if (isLoading) {
    return (
      <div className="chart-container flex items-center justify-center h-96">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Render no data state
  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">No chart data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Please check your connection and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container p-4">
      <div className="h-96 relative">
        <Chart
          ref={chartRef}
          type={chartType as any}
          data={chartData}
          options={chartOptions as any}
          key={`${symbol}-${chartType}-${data.length}`} // Force re-render on data change
        />
      </div>
    </div>
  );
};

export default PriceChart;