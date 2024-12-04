import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const limit = Math.min(Math.max(1, hours), 168); // Between 1 and 168 (1 week)

    const result = await sql`
      SELECT *
      FROM weather_history
      WHERE timestamp >= NOW() - INTERVAL '${limit} hours'
      ORDER BY timestamp DESC
    `;

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching weather history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather history' },
      { status: 500 }
    );
  }
} 