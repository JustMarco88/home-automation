import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = Math.min(days * 24, 720); // Max 30 days of hourly data

    const query = `
      SELECT 
        timestamp,
        temp,
        feels_like,
        humidity,
        description,
        icon,
        wind_speed,
        wind_deg,
        pressure,
        clouds,
        rain_1h,
        snow_1h
      FROM weather_history
      WHERE timestamp > NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    
    return NextResponse.json({ 
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching weather history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather history' },
      { status: 500 }
    );
  }
} 