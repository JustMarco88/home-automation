import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // First, create migrations table if it doesn't exist
    await sql.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Read and execute all migration files
    const migrations = [
      '001_create_weather_table.sql',
      '002_create_energy_prices_table.sql'
    ];

    const results = [];

    for (const migrationFile of migrations) {
      try {
        const migration = await sql.query(`
          SELECT id FROM migrations WHERE name = $1
        `, [migrationFile]);

        if (migration.rowCount === 0) {
          // Read migration file content
          const migrationContent = fs.readFileSync(
            path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', migrationFile),
            'utf8'
          );

          // Execute migration
          await sql.query(migrationContent);

          // Record migration
          await sql.query(`
            INSERT INTO migrations (name, executed_at)
            VALUES ($1, NOW())
          `, [migrationFile]);

          results.push({ file: migrationFile, status: 'executed' });
        } else {
          results.push({ file: migrationFile, status: 'already executed' });
        }
      } catch (error) {
        console.error(`Error executing migration ${migrationFile}:`, error);
        results.push({ 
          file: migrationFile, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migrations completed',
      results 
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run migrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 