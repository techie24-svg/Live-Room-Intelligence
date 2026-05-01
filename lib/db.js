// lib/db.js
import { Pool } from "pg";

let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in environment variables");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

export function getSql() {
  return async function sql(query, params = []) {
    const client = await getPool().connect();

    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  };
}

export async function sql(query, params = []) {
  const client = await getPool().connect();

  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (err) {
    console.error("DB ERROR:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function dbHealth() {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch (err) {
    console.error("DB health failed:", err);
    return false;
  }
}
