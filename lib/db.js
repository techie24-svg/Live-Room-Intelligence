import { Pool } from "pg";

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function sql(query, params = []) {
  const client = await getPool().connect();
  try {
    const res = await client.query(query, params);
    return res.rows;
  } finally {
    client.release();
  }
}
