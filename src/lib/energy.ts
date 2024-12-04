import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';

export interface EnergyPrice {
  timestamp: Date;
  priceEnergy: number | null;
  p1CounterEnergy: number | null;
  priceGas: number | null;
  p1CounterGas: number | null;
}

const CACHE_TTL = 3600; // 1 hour in seconds
const ENEVER_API_TOKEN = process.env.ENEVER_API_TOKEN;
const DOMOTICZ_URL = process.env.DOMOTICZ_URL;

export async function fetchEnergyPrices(): Promise<EnergyPrice[]> {
  const cacheKey = 'energy:prices:latest';
  const cached = await kv.get<EnergyPrice[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await sql`
    SELECT timestamp, price_energy, p1_counter_energy, price_gas, p1_counter_gas
    FROM energy_prices
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
    ORDER BY timestamp DESC
  `;

  const prices = result.rows.map(row => ({
    timestamp: new Date(row.timestamp),
    priceEnergy: row.price_energy,
    p1CounterEnergy: row.p1_counter_energy,
    priceGas: row.price_gas,
    p1CounterGas: row.p1_counter_gas
  }));

  await kv.set(cacheKey, prices, { ex: CACHE_TTL });
  return prices;
}

export async function fetchEneverPrices(type: 'energy' | 'gas'): Promise<any> {
  if (!ENEVER_API_TOKEN) {
    throw new Error('ENEVER_API_TOKEN is not configured');
  }

  const endpoint = type === 'energy' 
    ? `https://enever.nl/api/stroomprijs_morgen.php?token=${ENEVER_API_TOKEN}`
    : `https://enever.nl/api/gasprijs_vandaag.php?token=${ENEVER_API_TOKEN}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} prices from Enever: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchDomoticzP1Data(): Promise<{ energy: number; gas: number }> {
  if (!DOMOTICZ_URL) {
    throw new Error('DOMOTICZ_URL is not configured');
  }

  const energyResponse = await fetch(`${DOMOTICZ_URL}/json.htm?type=devices&rid=1`);
  const gasResponse = await fetch(`${DOMOTICZ_URL}/json.htm?type=devices&rid=5`);

  if (!energyResponse.ok || !gasResponse.ok) {
    throw new Error('Failed to fetch P1 data from Domoticz');
  }

  const energyData = await energyResponse.json();
  const gasData = await gasResponse.json();

  return {
    energy: parseFloat(energyData.result[0].Counter),
    gas: parseFloat(gasData.result[0].Counter)
  };
}

export async function storeEnergyPrice(data: Partial<EnergyPrice>): Promise<void> {
  const { timestamp, priceEnergy, p1CounterEnergy, priceGas, p1CounterGas } = data;

  if (!timestamp) {
    throw new Error('Timestamp is required');
  }

  await sql`
    INSERT INTO energy_prices (
      timestamp, price_energy, p1_counter_energy, price_gas, p1_counter_gas
    ) 
    VALUES (
      ${timestamp.toISOString()}, ${priceEnergy}, ${p1CounterEnergy}, ${priceGas}, ${p1CounterGas}
    )
    ON CONFLICT (timestamp) DO UPDATE SET
      price_energy = EXCLUDED.price_energy,
      p1_counter_energy = EXCLUDED.p1_counter_energy,
      price_gas = EXCLUDED.price_gas,
      p1_counter_gas = EXCLUDED.p1_counter_gas
  `;

  // Invalidate cache
  await kv.del('energy:prices:latest');
} 