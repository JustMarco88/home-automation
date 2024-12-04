import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface EnergyRecord {
  date: string;
  price_energy: number | null;
  p1_counter_energy: number | null;
  price_gas: number | null;
  p1_counter_gas: number | null;
}

async function migrateToPostgres() {
  try {
    // Check if SQLite database exists
    const dbPath = path.join(process.cwd(), 'db-to-migrate', 'energy.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error(`SQLite database not found at ${dbPath}`);
    }
    console.log('Found SQLite database at:', dbPath);

    // Open SQLite database
    const db = new Database(dbPath);
    console.log('Opened SQLite database');

    // Ensure the table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='prices'").get();
    if (!tableExists) {
      throw new Error("Table 'prices' not found in SQLite database");
    }
    console.log('Found prices table');

    // Create PostgreSQL table
    console.log('Creating PostgreSQL table...');
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

    // Get total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM prices').get() as { count: number };
    console.log(`Found ${totalCount.count} records to migrate`);

    // Process in batches
    const BATCH_SIZE = 100;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    while (processedCount < totalCount.count) {
      // Get batch of records
      const records = db.prepare('SELECT * FROM prices ORDER BY date ASC LIMIT ? OFFSET ?')
        .all(BATCH_SIZE, processedCount) as EnergyRecord[];

      console.log(`Processing batch ${processedCount / BATCH_SIZE + 1}...`);

      // Process each record
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
          console.error('Error processing record:', record.date, error);
          errorCount++;
        }
      }

      processedCount += records.length;
      console.log(`Progress: ${processedCount}/${totalCount.count} records processed`);
      console.log(`Success: ${successCount}, Failed: ${errorCount}`);
    }

    // Close SQLite database
    db.close();
    console.log('\nMigration completed!');
    console.log('Summary:');
    console.log(`Total records: ${totalCount.count}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed to migrate: ${errorCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('Starting migration to Vercel PostgreSQL...');
migrateToPostgres(); 