import { NextResponse } from 'next/server';
import { executeMigration, tableExists } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Check if weather_history table exists
    const exists = await tableExists('weather_history');
    if (exists) {
      return NextResponse.json({ message: 'Database already initialized' });
    }

    // Read and execute migration file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', '001_create_weather_table.sql');
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    
    await executeMigration(migrationSql);
    
    return NextResponse.json({ message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to run migration' },
      { status: 500 }
    );
  }
} 