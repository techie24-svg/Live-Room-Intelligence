# Delta: Participant "My questions"

This delta adds a participant-side "My questions" section.

## Files included

- `app/room/[code]/page.jsx`
- `app/api/questions/route.js`
- `app/api/setup/route.js`

## What changed

- Questions now save `session_id` with `user_name`.
- `/api/questions?roomCode=...&sessionId=...` returns only that participant's questions.
- Participant page shows a "My questions" review section below the question form.
- `/setup` now creates/migrates `questions.session_id` and the needed index.

## After applying

1. Commit/push to GitHub.
2. Redeploy on Vercel with build cache off.
3. Open `/setup`.
4. Click **Run Setup** once.
