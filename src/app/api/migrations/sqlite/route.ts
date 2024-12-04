import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import path from 'path';

// Disable body parsing, as we don't need it for this endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};

async function migrateData() {
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

    // Sample data for testing
    const testData = [
      {
        timestamp: new Date().toISOString(),
        price_energy: 0.25,
        p1_counter_energy: 1000,
        price_gas: 0.80,
        p1_counter_gas: 500
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    // Insert test data
    for (const record of testData) {
      try {
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
        `, [record.timestamp, record.price_energy, record.p1_counter_energy, record.price_gas, record.p1_counter_gas]);
        
        successCount++;
      } catch (error) {
        console.error('Error inserting record:', error);
        errorCount++;
      }
    }

    return {
      success: true,
      message: 'Migration completed',
      results: {
        successful: successCount,
        failed: errorCount,
        total: testData.length
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
  // Check for authorization
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.MIGRATION_SECRET;

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'MIGRATION_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await migrateData();
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