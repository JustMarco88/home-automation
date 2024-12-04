import { NextResponse } from 'next/server';
import { fetchEnergyPrices } from '@/lib/energy';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const prices = await fetchEnergyPrices();
    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    console.error('Failed to fetch energy prices:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch energy prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 