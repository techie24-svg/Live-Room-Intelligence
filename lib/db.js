import { neon } from '@neondatabase/serverless';

let cachedSql = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Add Neon DATABASE_URL in Vercel Project Settings → Environment Variables, then redeploy.');
  }
  if (!cachedSql) cachedSql = neon(process.env.DATABASE_URL);
  return cachedSql;
}
