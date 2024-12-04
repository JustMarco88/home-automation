import { NextResponse } from 'next/server';
import { getCacheKey, setCacheKey } from '@/lib/cache';

export async function GET() {
  try {
    const testKey = 'health_check';
    const testValue = { timestamp: Date.now() };

    // Try to write to Redis
    await setCacheKey(testKey, testValue, 60); // Expires in 60 seconds

    // Try to read from Redis
    const result = await getCacheKey(testKey);

    if (!result) {
      throw new Error('Failed to read test value from Redis');
    }

    return NextResponse.json({
      status: 'healthy',
      redis: {
        write: true,
        read: true,
        value: result
      }
    });
  } catch (error: any) {
    console.error('Redis health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
} 