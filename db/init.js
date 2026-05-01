const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Put it in .env.local or export it before running npm run db:init');
  }
  const sql = neon(process.env.DATABASE_URL);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log('Database initialized.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
