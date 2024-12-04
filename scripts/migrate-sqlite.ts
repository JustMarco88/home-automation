import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';
import path from 'path';

interface EnergyRecord {
  date: string;
  price_energy: number | null;
  p1_counter_energy: number | null;
  price_gas: number | null;
  p1_counter_gas: number | null;
}

async function migrateData() {
  try {
    // Open SQLite database
    const db = new Database(path.join(process.cwd(), 'db-to-migrate', 'energy.db'));

    // Get all records from SQLite
    const records = db.prepare('SELECT * FROM prices ORDER BY date ASC').all() as EnergyRecord[];
    console.log(`Found ${records.length} records to migrate`);

    // Batch size for inserting
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    // Process records in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      try {
        // Process each record in the batch
        for (const record of batch) {
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
        }

        successCount += batch.length;
        console.log(`Migrated batch ${i / BATCH_SIZE + 1}, total progress: ${successCount}/${records.length}`);
      } catch (error) {
        errorCount += batch.length;
        console.error(`Error migrating batch ${i / BATCH_SIZE + 1}:`, error);
      }
    }

    await db.close();
    console.log('\nMigration completed:');
    console.log(`Successfully migrated: ${successCount} records`);
    console.log(`Failed to migrate: ${errorCount} records`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData(); 