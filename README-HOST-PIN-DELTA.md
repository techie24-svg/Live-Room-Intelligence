# Host PIN delta

Copy these files into your project and overwrite existing files.

## What changed
- New sessions now generate a 6-digit host PIN.
- The PIN is saved in the host browser after creating a session.
- Direct visits to `/presenter/[code]` now require the host PIN.
- `POST /api/summary` now requires the host PIN.
- `rooms.host_pin` migration is included in `db/schema.sql`.

## After copying files
1. Commit/push to GitHub.
2. Redeploy on Vercel with build cache off.
3. Run setup/db migration again if your database already exists, or run this SQL manually:

```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_pin TEXT;
```

Existing rooms created before this change will not have a PIN. Create a new session after deploying.
