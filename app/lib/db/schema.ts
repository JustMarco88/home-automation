import { sql } from '@vercel/postgres';
import { timestamp, pgTable, serial, numeric, json, text } from 'drizzle-orm/pg-core';

// Energy consumption metrics table
export const energyMetrics = pgTable('energy_metrics', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  consumption: numeric('consumption').notNull(),
  device_id: text('device_id').notNull(),
  metadata: json('metadata'),
  created_at: timestamp('created_at').defaultNow(),
});

// Environmental metrics table
export const environmentMetrics = pgTable('environment_metrics', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  temperature: numeric('temperature'),
  humidity: numeric('humidity'),
  co2: numeric('co2'),
  device_id: text('device_id').notNull(),
  metadata: json('metadata'),
  created_at: timestamp('created_at').defaultNow(),
}); 