import { query, getDbPool } from './client';

/**
 * Key-value store using PostgreSQL kv_store_19ccd85e table
 * Replaces Supabase KV store functionality
 */

export async function set(key: string, value: any): Promise<void> {
  await query(
    `INSERT INTO kv_store_19ccd85e (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

export async function get<T = any>(key: string): Promise<T | null> {
  const result = await query<{ value: any }>(
    'SELECT value FROM kv_store_19ccd85e WHERE key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].value as T;
}

export async function del(key: string): Promise<void> {
  await query('DELETE FROM kv_store_19ccd85e WHERE key = $1', [key]);
}

export async function mset(keys: string[], values: any[]): Promise<void> {
  if (keys.length !== values.length) {
    throw new Error('Keys and values arrays must have the same length');
  }

  const valuesArray = keys.map((k, i) => [k, JSON.stringify(values[i])]);
  
  // Use a transaction for multiple inserts
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const [key, value] of valuesArray) {
      await client.query(
        `INSERT INTO kv_store_19ccd85e (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function mget<T = any>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) {
    return [];
  }

  const result = await query<{ key: string; value: any }>(
    'SELECT key, value FROM kv_store_19ccd85e WHERE key = ANY($1)',
    [keys]
  );

  const valueMap = new Map(
    result.rows.map((row) => [row.key, row.value as T])
  );

  return keys.map((key) => valueMap.get(key) ?? null);
}

export async function mdel(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await query('DELETE FROM kv_store_19ccd85e WHERE key = ANY($1)', [keys]);
}

export async function getByPrefix<T = any>(prefix: string): Promise<T[]> {
  const result = await query<{ value: any }>(
    "SELECT value FROM kv_store_19ccd85e WHERE key LIKE $1",
    [`${prefix}%`]
  );

  return result.rows.map((row) => row.value as T);
}

