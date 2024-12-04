'use client';

import { useEffect } from 'react';
import { useSWR } from 'swr';
import { Line } from 'react-chartjs-2';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  timestamp: number;
  wind_speed?: number;
  wind_deg?: number;
  pressure?: number;
  clouds?: number;
  rain_1h?: number;
  snow_1h?: number;
}

interface WeatherResponse {
  data: WeatherData;
  source: 'cache' | 'api';
  notice?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Weather() {
  const { data: response, error, isLoading } = useSWR<WeatherResponse>(
    '/api/metrics/weather',
    fetcher,
    {
      refreshInterval: 1800000, // 30 minutes
      revalidateOnFocus: false, // Don't revalidate on tab focus
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    }
  );

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500">Failed to load weather data</div>
      </div>
    );
  }

  if (isLoading || !response?.data) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const { data: weather, source } = response;
  const lastUpdate = new Date(weather.timestamp).toLocaleTimeString();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">Weather</h2>
        <div className="text-xs text-gray-400">
          Updated: {lastUpdate}
          {source === 'cache' && ' (cached)'}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-20 h-20"
        />
        <div className="text-4xl font-bold mb-2">{weather.temp}°C</div>
        <div className="text-gray-600 capitalize mb-2">{weather.description}</div>
        <div className="text-sm text-gray-500">
          Feels like: {weather.feels_like}°C
        </div>
        <div className="text-sm text-gray-500">
          Humidity: {weather.humidity}%
        </div>
        {weather.wind_speed && (
          <div className="text-sm text-gray-500">
            Wind: {weather.wind_speed} m/s
            {weather.wind_deg && ` from ${weather.wind_deg}°`}
          </div>
        )}
        {weather.pressure && (
          <div className="text-sm text-gray-500">
            Pressure: {weather.pressure} hPa
          </div>
        )}
        {weather.clouds && (
          <div className="text-sm text-gray-500">
            Cloud cover: {weather.clouds}%
          </div>
        )}
        {(weather.rain_1h || weather.snow_1h) && (
          <div className="text-sm text-gray-500">
            Precipitation: {weather.rain_1h || weather.snow_1h} mm
          </div>
        )}
      </div>
    </div>
  );
} 