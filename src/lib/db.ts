import { sql } from '@vercel/postgres';
import { getCacheKey, setCacheKey } from './cache';

export const db = sql;

export async function queryWithCache<T>(
  key: string,
  query: string,
  params: any[] = [],
  ttl: number = 60 // default cache time in seconds
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getCacheKey<T>(key);
    if (cached) {
      return cached;
    }

    // If not in cache, query database
    const result = await sql.query(query, params);
    const data = result.rows as T;

    // Store in cache
    await setCacheKey(key, data, ttl);

    return data;
  } catch (error) {
    console.error('Error in queryWithCache:', error);
    throw error;
  }
}

// Helper function to execute migrations
export async function executeMigration(migrationSql: string): Promise<void> {
  try {
    await sql.query(migrationSql);
    console.log('Migration executed successfully');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

// Helper function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  const result = await sql.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
} 