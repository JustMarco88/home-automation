import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { energyMetrics, environmentMetrics } from './schema';

interface LegacyEnergyData {
  timestamp: string;
  consumption: number;
  device_id: string;
  metadata?: Record<string, any>;
}

interface LegacyEnvironmentData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  co2?: number;
  device_id: string;
  metadata?: Record<string, any>;
}

export async function migrateLegacyData(
  legacyEnergyData: LegacyEnergyData[],
  legacyEnvironmentData: LegacyEnvironmentData[]
) {
  const db = drizzle(sql);
  
  try {
    // Migrate energy data in batches
    for (let i = 0; i < legacyEnergyData.length; i += 100) {
      const batch = legacyEnergyData.slice(i, i + 100);
      await db.insert(energyMetrics).values(
        batch.map(record => ({
          timestamp: new Date(record.timestamp),
          consumption: record.consumption,
          device_id: record.device_id,
          metadata: record.metadata || {},
        }))
      );
    }

    // Migrate environmental data in batches
    for (let i = 0; i < legacyEnvironmentData.length; i += 100) {
      const batch = legacyEnvironmentData.slice(i, i + 100);
      await db.insert(environmentMetrics).values(
        batch.map(record => ({
          timestamp: new Date(record.timestamp),
          temperature: record.temperature,
          humidity: record.humidity,
          co2: record.co2,
          device_id: record.device_id,
          metadata: record.metadata || {},
        }))
      );
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
} 