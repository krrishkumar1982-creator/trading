import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
  var _dbInitialized: boolean | undefined;
}

export const createPool = (): pg.Pool => {
  if (!global._postgresPool) {
    const connectionString =
      process.env.SUPABASE_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.POSTGRES_URL;

    if (connectionString) {
      const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
      global._postgresPool = new Pool({
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX, 10) : 10,
        idleTimeoutMillis: process.env.DATABASE_IDLE_TIMEOUT_MS ? parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS, 10) : 30000,
        connectionTimeoutMillis: process.env.DATABASE_CONNECTION_TIMEOUT_MS ? parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10) : 15000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
    } else {
      const host = process.env.SQL_HOST || process.env.PGHOST || process.env.SUPABASE_HOST || 'localhost';
      const isRemoteHost = host.includes('supabase') || host.includes('pooler') || host.includes('aws') || host.includes('gcp');
      const isSsl = process.env.DB_SSL === 'true' || process.env.SQL_SSL === 'true' || isRemoteHost;

      global._postgresPool = new Pool({
        host,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : (process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432),
        user: process.env.SQL_USER || process.env.PGUSER || process.env.SUPABASE_USER || 'postgres',
        password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || process.env.SUPABASE_PASSWORD || '',
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE || process.env.SUPABASE_DB_NAME || 'postgres',
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX, 10) : 10,
        idleTimeoutMillis: process.env.DATABASE_IDLE_TIMEOUT_MS ? parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS, 10) : 30000,
        connectionTimeoutMillis: process.env.DATABASE_CONNECTION_TIMEOUT_MS ? parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10) : 15000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
    }

    global._postgresPool.on('error', (err: any) => {
      // Idle client connection terminations are completely normal in cloud databases (e.g. Supabase / Cloud SQL / serverless DBs
      // closing idle connections after a timeout). We log these as warnings to avoid triggering false alarms.
      if (err && (err.message?.includes('Connection terminated unexpectedly') || err.code === 'ECONNRESET')) {
        console.warn('SQL Pool client connection was closed by remote database (idle connection termination):', err.message);
      } else {
        console.error('Unexpected error on idle SQL pool client:', err);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export async function ensureLoungeTables() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS post_likes (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS post_comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          author_name TEXT NOT NULL,
          author_avatar TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS broker_integrations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          display_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'CONNECTED',
          secret_hash TEXT NOT NULL,
          external_account_id TEXT,
          last_sync_at TEXT,
          last_event_at TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS integration_events (
          id TEXT PRIMARY KEY,
          integration_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          external_event_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          payload JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'PROCESSED',
          error TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS daily_checklist_states (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          item_id TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          CONSTRAINT unique_user_date_item UNIQUE (user_id, date, item_id)
        );
      `);
      global._dbInitialized = true;
    } finally {
      client.release();
    }
  } catch (err) {
    global._dbInitialized = true;
  }
}

export const db = drizzle(pool, { schema });
ensureLoungeTables();
