import { NextResponse } from 'next/server';
import { fetchWeatherData } from '@/lib/weather';
import { getCacheKey, setCacheKey } from '@/lib/cache';

const CACHE_KEY = 'weather_data';
const CACHE_DURATION = 1800; // 30 minutes in seconds
const STALE_THRESHOLD = 1800000; // 30 minutes in milliseconds

export async function GET() {
  try {
    // Try to get from cache first
    const cached = await getCacheKey(CACHE_KEY);
    
    if (cached) {
      const data = cached as any;
      // Check if cache is still fresh
      if (Date.now() - data.timestamp < STALE_THRESHOLD) {
        return NextResponse.json({ data, source: 'cache' });
      }
    }

    // If no cache or stale, fetch new data
    const data = await fetchWeatherData();
    
    // Cache for 30 minutes
    await setCacheKey(CACHE_KEY, data, CACHE_DURATION);
    
    return NextResponse.json({ data, source: 'api' });
  } catch (error: any) {
    console.error('Error in weather route:', error);
    
    // Try to get cached data again in case of error
    const fallbackData = await getCacheKey(CACHE_KEY);
    
    // If rate limited and we have cached data, return it
    if (error.message?.includes('Rate limit') && fallbackData) {
      return NextResponse.json({ 
        data: fallbackData, 
        source: 'cache',
        notice: 'Using cached data due to rate limiting'
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 