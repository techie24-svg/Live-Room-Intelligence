# Delta: /setup database setup page

## Files included

- `app/api/setup/route.js`
- `app/setup/page.jsx`
- `db/schema.sql`

## Important

If your repo also has `app/setup/page.js`, delete it. Next.js should have only one setup page file in `app/setup/`.

## How to use

1. Copy these files into your repo.
2. Commit and redeploy on Vercel with build cache OFF.
3. Open `/setup` on your deployed site.
4. Click **Check database**.
5. Click **Run setup**.

Optional: add `SETUP_SECRET` in Vercel env vars. If you set it, enter that same value on the `/setup` page.
