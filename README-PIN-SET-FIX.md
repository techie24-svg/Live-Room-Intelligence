# Delta: Host PIN creation fix

This delta fixes the host PIN UX.

## Files changed
- `app/page.jsx`

## What changed
- Host can now set a 4-12 digit PIN before creating a session.
- The PIN is sent to `/api/rooms` and saved on the room.
- The PIN is stored in localStorage for that room so the host dashboard opens immediately.
- On reload or another device, the host can enter that same PIN to unlock the dashboard.

## Apply
Copy files into your project, overwrite existing files, commit, and redeploy on Vercel with build cache off.
