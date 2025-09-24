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

  // Determine actual chart type for Chart.js (OHLC uses ohlc controller)
  const actualChartType = chartType === 'ohlc' ? 'ohlc' : chartType === 'line' ? 'line' : 'candlestick';

  // Transform data for Chart.js - supporting candlestick, line, and OHLC bar charts
  const chartData = useMemo((): ChartData<'candlestick' | 'line' | 'ohlc'> => {
    const safeData = data || [];
    console.log(`📊 Chart rendering ${safeData.length} candles for ${symbol}`);

    if (chartType === 'line') {
      return {
        labels: safeData.map(item => new Date(item.timestamp)),
        datasets: [{
          label: `${symbol} Price`,
          data: safeData.map(item => ({
            x: item.timestamp,
            y: item.close
          })),
          borderColor: '#0ECB81', // Binance green
          backgroundColor: 'rgba(14, 203, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#0ECB81',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1
        }]
      };
    } else {
      // Both candlestick and OHLC use OHLC data format
      return {
        labels: safeData.map(item => new Date(item.timestamp)),
        datasets: [{
          label: symbol,
          data: safeData.map(item => {
            // Ensure proper OHLC values to prevent rendering issues
            const open = parseFloat(item.open.toString());
            const high = parseFloat(item.high.toString());
            const low = parseFloat(item.low.toString());
            const close = parseFloat(item.close.toString());

            // Validate OHLC relationships to fix rendering issues
            const validHigh = Math.max(open, high, low, close);
            const validLow = Math.min(open, high, low, close);

            return {
              x: item.timestamp,
              o: open,
              h: validHigh,
              l: validLow,
              c: close
            };
          }),
          borderColor: (ctx: any) => {
            const data = ctx.raw || {};
            return data.c >= data.o ? '#0ECB81' : '#F6465D'; // Binance colors
          },
          backgroundColor: (ctx: any) => {
            const data = ctx.raw || {};
            return data.c >= data.o ? 'rgba(14, 203, 129, 0.6)' : 'rgba(244, 70, 93, 0.6)';
          },
          borderWidth: chartType === 'ohlc' ? 2 : 1 // Thicker lines for OHLC bars
        }]
      };
    }
  }, [data, chartType, symbol]);

  // Chart configuration for all chart types
  const chartOptions: ChartOptions<'candlestick' | 'line' | 'ohlc'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        backgroundColor: 'rgba(11, 14, 17, 0.95)', // Binance dark
        titleColor: '#EAECEF',
        bodyColor: '#EAECEF',
        borderColor: '#2B2F36',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (context[0] && context[0].parsed) {
              return new Date((context[0].parsed as any).x).toLocaleString();
            }
            return '';
          },
          label: (context) => {
            if (chartType === 'line') {
              return `Price: $${formatPrice((context.parsed as any).y, 6)}`;
            } else {
              const data = context.raw as any;
              return [
                `O: $${formatPrice(data.o, 6)}`,
                `H: $${formatPrice(data.h, 6)}`,
                `L: $${formatPrice(data.l, 6)}`,
                `C: $${formatPrice(data.c, 6)}`
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
            hour: 'dd HH:mm',
            day: 'MMM dd'
          }
        },
        grid: {
          display: true,
          color: 'rgba(43, 47, 54, 0.5)'
        },
        ticks: {
          color: '#848E9C',
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(43, 47, 54, 0.5)'
        },
        ticks: {
          color: '#848E9C',
          font: {
            size: 11
          },
          callback: function(value: any) {
            const price = value as number;
            return price < 1 ? `$${price.toFixed(6)}` : `$${price.toFixed(2)}`;
          }
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 3
      }
    },
    animation: false, // Disable all animations for instant updates
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
  }), [chartType]);

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

  // Log live data updates for debugging
  useEffect(() => {
    if (data && data.length > 0) {
      const lastCandle = data[data.length - 1];
      console.log(`📊 CHART UPDATE: ${symbol} - ${data.length} candles - Latest: $${lastCandle.close} @ ${new Date(lastCandle.timestamp).toLocaleTimeString()}`);
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

  // Render the chart with proper type
  return (
    <div className="chart-container p-4">
      <div className="h-96 relative">
        <Chart
          ref={chartRef}
          type={actualChartType as any}
          data={chartData}
          options={chartOptions as any}
          key={`${symbol}-${chartType}-${data?.length || 0}`} // Force re-render on data change
        />
      </div>
    </div>
  );
};

export default PriceChart;