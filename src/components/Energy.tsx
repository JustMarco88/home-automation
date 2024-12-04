'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { EnergyPrice } from '@/lib/energy';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ApiResponse {
  success: boolean;
  data?: EnergyPrice[];
  error?: string;
  details?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Energy() {
  const { data: response, error, isLoading } = useSWR<ApiResponse>(
    '/api/metrics/energy',
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  if (error || (response && !response.success)) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">
          {response?.error || 'Failed to load energy data'}
          {response?.details && (
            <span className="block text-sm mt-1">{response.details}</span>
          )}
        </p>
      </div>
    );
  }

  if (isLoading || !response?.data) {
    return (
      <div className="animate-pulse bg-gray-100 p-4 rounded-lg">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const prices = [...response.data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (prices.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-800">No energy data available</p>
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: 'Energy Price (€/kWh)',
        data: prices.map((p) => ({
          x: new Date(p.timestamp),
          y: p.priceEnergy
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Gas Price (€/m³)',
        data: prices.map((p) => ({
          x: new Date(p.timestamp),
          y: p.priceGas
        })),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        yAxisID: 'y'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price (€)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Energy Prices (24h)'
      }
    }
  };

  // Get latest prices
  const latestData = prices[prices.length - 1];
  
  return (
    <div className="space-y-6">
      {/* Current Prices Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Current Energy Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Electricity</div>
            <div className="text-2xl font-bold text-blue-700">
              €{latestData.priceEnergy?.toFixed(4) || '---'}/kWh
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Usage: {latestData.p1CounterEnergy?.toFixed(2) || '---'} kWh
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600">Gas</div>
            <div className="text-2xl font-bold text-red-700">
              €{latestData.priceGas?.toFixed(4) || '---'}/m³
            </div>
            <div className="text-sm text-red-600 mt-1">
              Usage: {latestData.p1CounterGas?.toFixed(2) || '---'} m³
            </div>
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
} 