import { NextResponse } from 'next/server';
import { fetchEnergyPrices, fetchEneverPrices, fetchDomoticzP1Data, storeEnergyPrice } from '@/lib/energy';

export async function GET() {
  try {
    const prices = await fetchEnergyPrices();
    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    console.error('Failed to fetch energy prices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch energy prices' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Fetch energy prices from Enever
    const [energyPrices, gasPrices] = await Promise.all([
      fetchEneverPrices('energy'),
      fetchEneverPrices('gas')
    ]);

    // Fetch P1 meter data from Domoticz
    const p1Data = await fetchDomoticzP1Data();

    // Store the data for each hour
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to current hour

    // Process energy prices (hourly data)
    for (const hourData of energyPrices.data) {
      const timestamp = new Date(hourData.datum);
      await storeEnergyPrice({
        timestamp,
        priceEnergy: hourData.prijsZP,
        p1CounterEnergy: timestamp.getTime() === now.getTime() ? p1Data.energy : null
      });
    }

    // Process gas prices (daily data, replicate for each hour)
    const gasPrice = gasPrices.data[0].prijsZP;
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now);
      timestamp.setHours(i, 0, 0, 0);
      await storeEnergyPrice({
        timestamp,
        priceGas: gasPrice,
        p1CounterGas: timestamp.getTime() === now.getTime() ? p1Data.gas : null
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update energy data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update energy data' },
      { status: 500 }
    );
  }
} 