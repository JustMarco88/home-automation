import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Remove edge runtime as SQLite requires Node.js runtime
export const dynamic = 'force-dynamic';

interface EnergyRecord {
  date: string;
  price_energy: number | null;
  p1_counter_energy: number | null;
  price_gas: number | null;
  p1_counter_gas: number | null;
}

// Validation functions
function validateDate(date: string): boolean {
  const timestamp = Date.parse(date);
  return !isNaN(timestamp) && timestamp > 0;
}

function validateNumber(value: number | null): boolean {
  return value === null || (!isNaN(value) && value >= 0);
}

function validateRecord(record: EnergyRecord): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateDate(record.date)) {
    errors.push(`Invalid date: ${record.date}`);
  }

  if (!validateNumber(record.price_energy)) {
    errors.push(`Invalid energy price: ${record.price_energy}`);
  }

  if (!validateNumber(record.p1_counter_energy)) {
    errors.push(`Invalid energy counter: ${record.p1_counter_energy}`);
  }

  if (!validateNumber(record.price_gas)) {
    errors.push(`Invalid gas price: ${record.price_gas}`);
  }

  if (!validateNumber(record.p1_counter_gas)) {
    errors.push(`Invalid gas counter: ${record.p1_counter_gas}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function migrateData(startIndex: number = 0, batchSize: number = 10) {
  try {
    // Check if SQLite database exists
    const dbPath = path.join(process.cwd(), 'db-to-migrate', 'energy.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error(`SQLite database not found at ${dbPath}`);
    }

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
    const db = new Database(dbPath);

    // Validate table structure
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prices'").get();
    if (!tableExists) {
      db.close();
      throw new Error("Table 'prices' not found in SQLite database");
    }

    // Get total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prices').get() as { count: number };

    // Validate batch parameters
    if (startIndex < 0) {
      throw new Error('Start index cannot be negative');
    }
    if (startIndex >= totalCount.count) {
      throw new Error('Start index exceeds total record count');
    }
    if (batchSize <= 0) {
      throw new Error('Batch size must be positive');
    }

    // Get records for this batch
    const records = db.prepare('SELECT * FROM prices ORDER BY date ASC LIMIT ? OFFSET ?')
      .all(batchSize, startIndex) as EnergyRecord[];

    let successCount = 0;
    let errorCount = 0;
    let validationErrors: { record: EnergyRecord; errors: string[] }[] = [];

    // Process records
    for (const record of records) {
      try {
        // Validate record
        const validation = validateRecord(record);
        if (!validation.valid) {
          validationErrors.push({ record, errors: validation.errors });
          errorCount++;
          continue;
        }

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
        nextBatch: startIndex + records.length < totalCount.count ? startIndex + records.length : null,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
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

    // Validate query parameters
    if (isNaN(startIndex) || isNaN(batchSize)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: 'Start index and batch size must be valid numbers'
        },
        { status: 400 }
      );
    }

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