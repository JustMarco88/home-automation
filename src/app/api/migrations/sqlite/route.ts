import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';
import path from 'path';

// Remove edge runtime as SQLite requires Node.js runtime
export const dynamic = 'force-dynamic';

interface EnergyRecord {
  date: string;
  price_energy: number | null;
  p1_counter_energy: number | null;
  price_gas: number | null;
  p1_counter_gas: number | null;
}

async function migrateData(startIndex: number = 0, batchSize: number = 10) {
  try {
    // First ensure the energy_prices table exists
    await sql.query(`
      CREATE TABLE IF NOT EXISTS energy_prices (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
        price_energy DECIMAL(10, 4),
        p1_counter_energy DECIMAL(10, 4),
        price_gas DECIMAL(10, 4),
        p1_counter_gas DECIMAL(10, 4),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Open SQLite database
    const dbPath = path.join(process.cwd(), 'db-to-migrate', 'energy.db');
    const db = new Database(dbPath);

    // Get total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prices').get() as { count: number };

    // Get records for this batch
    const records = db.prepare('SELECT * FROM prices ORDER BY date ASC LIMIT ? OFFSET ?')
      .all(batchSize, startIndex) as EnergyRecord[];

    let successCount = 0;
    let errorCount = 0;

    // Process records
    for (const record of records) {
      try {
        const timestamp = new Date(record.date).toISOString();
        await sql.query(`
          INSERT INTO energy_prices (
            timestamp,
            price_energy,
            p1_counter_energy,
            price_gas,
            p1_counter_gas
          ) 
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (timestamp) DO UPDATE SET
            price_energy = EXCLUDED.price_energy,
            p1_counter_energy = EXCLUDED.p1_counter_energy,
            price_gas = EXCLUDED.price_gas,
            p1_counter_gas = EXCLUDED.p1_counter_gas
        `, [timestamp, record.price_energy, record.p1_counter_energy, record.price_gas, record.p1_counter_gas]);
        
        successCount++;
      } catch (error) {
        console.error('Error inserting record:', error);
        errorCount++;
      }
    }

    // Close SQLite database
    db.close();

    return {
      success: true,
      message: 'Batch migration completed',
      results: {
        successful: successCount,
        failed: errorCount,
        total: totalCount.count,
        currentBatch: {
          start: startIndex,
          size: batchSize,
          processed: records.length
        },
        progress: `${startIndex + records.length}/${totalCount.count} records processed`,
        isComplete: startIndex + records.length >= totalCount.count,
        nextBatch: startIndex + records.length < totalCount.count ? startIndex + records.length : null
      }
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startIndex = parseInt(searchParams.get('start') || '0', 10);
    const batchSize = parseInt(searchParams.get('batch') || '10', 10);

    // Limit batch size to prevent timeouts
    const limitedBatchSize = Math.min(batchSize, 50);

    const result = await migrateData(startIndex, limitedBatchSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to run migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 