import { sql } from '@vercel/postgres';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function migrateData() {
  try {
    // Open SQLite database
    const db = await open({
      filename: path.join(process.cwd(), 'db-to-migrate', 'energy.db'),
      driver: sqlite3.Database
    });

    // Get all records from SQLite
    const records = await db.all('SELECT * FROM prices ORDER BY date ASC');
    console.log(`Found ${records.length} records to migrate`);

    // Batch size for inserting
    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    // Process records in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      try {
        // Create values string for the batch
        const values = batch.map((record, index) => {
          const offset = i + index + 1;
          return `($${offset * 4 - 3}, $${offset * 4 - 2}, $${offset * 4 - 1}, $${offset * 4})`;
        }).join(',');

        // Flatten parameters for the query
        const params = batch.flatMap(record => [
          new Date(record.date),
          record.price_energy,
          record.p1_counter_energy,
          record.price_gas,
          record.p1_counter_gas
        ]);

        // Insert batch into PostgreSQL
        await sql`
          INSERT INTO energy_prices (
            timestamp,
            price_energy,
            p1_counter_energy,
            price_gas,
            p1_counter_gas
          ) 
          VALUES ${sql(values)}
          ON CONFLICT (timestamp) DO UPDATE SET
            price_energy = EXCLUDED.price_energy,
            p1_counter_energy = EXCLUDED.p1_counter_energy,
            price_gas = EXCLUDED.price_gas,
            p1_counter_gas = EXCLUDED.p1_counter_gas
        `;

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