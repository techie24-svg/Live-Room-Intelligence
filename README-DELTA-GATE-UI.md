# Delta: Gate Participant UI Behind Name

This delta replaces only:

- `app/room/[code]/page.jsx`

## What changed

- The participant room now shows only the name/nickname form first.
- Mood voting and question submission stay hidden until the participant joins with a name.
- After joining, the original room UI is shown and the name is displayed in the header.

## Apply

1. Copy the files into your repo.
2. Commit and push.
3. Redeploy Vercel with build cache off.
