# Delta Gemini Fix

Copy these files into your project and overwrite existing files.

Changed file:
- `app/api/summary/route.js`

Fix:
- Replaces broken `gemini-1.5-pro` usage.
- Uses `gemini-2.5-flash` by default.
- Supports optional Vercel env var `GEMINI_MODEL` if you want to override it.
- Falls back to other Flash models if selected model is unavailable.

Required Vercel env var:
- `GEMINI_API_KEY`

Optional Vercel env var:
- `GEMINI_MODEL=gemini-2.5-flash`

After copying files, commit to GitHub and redeploy on Vercel with build cache off.
