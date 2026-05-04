# FeelPulse theme + logo consistency delta

Copy these files into your project and overwrite existing files.

Files included:
- `components/FeelPulseBrand.jsx`
- `app/page.jsx`
- `app/presenter/[code]/page.jsx`
- `app/room/[code]/page.jsx`

What changed:
- Global dark/light preference saved in `localStorage` as `feelpulse-theme`.
- Theme toggle added to presenter/host and attendee pages.
- FeelPulse logo/brand added to presenter/host and attendee pages.
- Light mode text contrast fixed across app pages.
- Attendee name remains per-room, not global.

After applying: commit, push, and redeploy on Vercel with build cache off.
