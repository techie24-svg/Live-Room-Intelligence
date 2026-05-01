# Delta: session / room creation fix

Copy these files into your existing GitHub project and overwrite matching paths.

Fixes:
- "Could not create a unique session" when creating a room
- Older database missing `rooms.title`
- Stable browser/device session id helper
- One active feeling vote per browser/device per room, but multiple questions still allowed

After copying:
1. Commit the changed files.
2. Redeploy on Vercel with build cache off.
3. Open `/setup` on your deployed app and click **Run Setup** once.
