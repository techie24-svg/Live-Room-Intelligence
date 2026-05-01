import { Pool } from "pg";

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add your Neon/Postgres connection string in Vercel Environment Variables.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function buildQuery(strings, values) {
  if (Array.isArray(strings) && Object.prototype.hasOwnProperty.call(strings, "raw")) {
    let text = "";
    const params = [];

    strings.forEach((part, index) => {
      text += part;
      if (index < values.length) {
        params.push(values[index]);
        text += `$${params.length}`;
      }
    });

    return { text, params };
  }

  return { text: strings, params: values[0] || [] };
}

export async function sql(strings, ...values) {
  const { text, params } = buildQuery(strings, values);
  const client = await getPool().connect();

  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export function getSql() {
  return sql;
}
