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

async function migrateData(startIndex: number = 0, batchSize: number = 10) {
  console.log(`Starting migration batch: startIndex=${startIndex}, batchSize=${batchSize}`);
  
  try {
    // Check if SQLite database exists
    const dbPath = path.join(process.cwd(), 'db-to-migrate', 'energy.db');
    console.log('Looking for SQLite database at:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file not found at:', dbPath);
      throw new Error(`SQLite database not found at ${dbPath}`);
    }
    console.log('Found SQLite database');

    // First ensure the energy_prices table exists
    console.log('Creating PostgreSQL table if not exists...');
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
    console.log('PostgreSQL table ready');

    // Open SQLite database
    console.log('Opening SQLite database...');
    const db = new Database(dbPath, { verbose: console.log });
    console.log('SQLite database opened');

    // Validate table structure
    console.log('Checking SQLite table structure...');
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prices'").get();
    if (!tableExists) {
      db.close();
      throw new Error("Table 'prices' not found in SQLite database");
    }
    console.log('SQLite table structure valid');

    // Get total count
    console.log('Getting total record count...');
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prices').get() as { count: number };
    console.log(`Total records found: ${totalCount.count}`);

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
    console.log(`Fetching batch of records: ${startIndex} to ${startIndex + batchSize}`);
    const records = db.prepare('SELECT * FROM prices ORDER BY date ASC LIMIT ? OFFSET ?')
      .all(batchSize, startIndex) as EnergyRecord[];
    console.log(`Fetched ${records.length} records`);

    let successCount = 0;
    let errorCount = 0;

    // Process records
    console.log('Processing records...');
    for (const record of records) {
      try {
        console.log('Processing record:', record.date);
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
        console.log(`Successfully processed record ${successCount}/${records.length}`);
      } catch (error) {
        console.error('Error processing record:', error);
        errorCount++;
      }
    }

    // Close SQLite database
    console.log('Closing SQLite database...');
    db.close();
    console.log('SQLite database closed');

    const result = {
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

    console.log('Migration batch completed:', result);
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: Request) {
  console.log('Migration endpoint called');
  try {
    const { searchParams } = new URL(request.url);
    const startIndex = parseInt(searchParams.get('start') || '0', 10);
    const batchSize = parseInt(searchParams.get('batch') || '10', 10);

    console.log('Migration parameters:', { startIndex, batchSize });

    // Validate query parameters
    if (isNaN(startIndex) || isNaN(batchSize)) {
      console.error('Invalid query parameters');
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
    console.log('Using batch size:', limitedBatchSize);

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