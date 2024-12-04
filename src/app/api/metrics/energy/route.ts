import { NextResponse } from 'next/server';
import { queryWithCache } from '@/lib/db';

export async function GET() {
  try {
    const cacheKey = 'energy_metrics_latest';
    const query = `
      SELECT 
        timestamp,
        energy_consumption,
        gas_consumption
      FROM energy_metrics
      ORDER BY timestamp DESC
      LIMIT 24
    `;

    const data = await queryWithCache(cacheKey, query, [], 300); // 5 minutes cache

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching energy metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy metrics' },
      { status: 500 }
    );
  }
} 