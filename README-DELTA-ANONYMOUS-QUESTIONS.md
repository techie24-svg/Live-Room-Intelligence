# Delta: Ask With Name or Anonymously

This delta updates the participant room page so a joinee can choose per question whether it appears with their name or as Anonymous.

## Files included
- `app/room/[code]/page.jsx`

## Behavior
- User still enters a name to join.
- Before submitting a question, user can toggle **Ask anonymously**.
- Host dashboard will show either the user name or `Anonymous`.
- The joinee's **My questions** list also shows whether that question was submitted anonymously.

No database migration is required because the existing `questions.user_name` column is reused.
