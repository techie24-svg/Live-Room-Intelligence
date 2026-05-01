# Delta: Current Participants on Host Dashboard

Copy these files into your project, replacing existing files when asked.

## What this adds

- Participants enter a name before the room UI unlocks.
- Participants are saved by room code + unique browser session.
- Host dashboard shows **Current Participants** and refreshes every 2 seconds.
- Questions include the participant name.
- `/setup` creates/migrates the `participants` table and `questions.user_name` column.

## After applying

1. Commit/push to GitHub.
2. Redeploy on Vercel with build cache off.
3. Open `/setup` and click **Run Setup** once.
4. Create a new session and join from a participant device/browser.
