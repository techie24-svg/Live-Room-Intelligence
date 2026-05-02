# Combined FeelPulse Delta

This delta combines the recent feature patches into one upload:

- stable per-device/session ID support
- host PIN create flow on home page
- participant tracking API and host participant list
- setup page/API updates for participants + questions.user_name + questions.session_id
- participant page name gate
- participant page "My questions"
- desktop 2-column joinee layout

## Apply
1. Unzip this file.
2. Copy everything into your GitHub repo root and overwrite existing files.
3. Commit/push.
4. Redeploy on Vercel with build cache off.
5. Open `/setup` and click **Run Setup** once.

## Notes
Existing sessions may not have host PINs. Create a new session after applying this patch.
