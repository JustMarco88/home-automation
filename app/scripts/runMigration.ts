import { migrateLegacyData } from '../lib/db/migrate';
import { readLegacyData } from './readLegacyData'; // You'll need to implement this based on your legacy data format

async function main() {
  try {
    // Read legacy data from your existing source
    const { energyData, environmentData } = await readLegacyData();
    
    // Run the migration
    await migrateLegacyData(energyData, environmentData);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 