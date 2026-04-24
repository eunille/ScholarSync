# MVP Smoke Test Checklist

## Preconditions
1. Set real credentials in `.env.local`.
2. Run `supabase-schema.sql` in Supabase SQL Editor.
3. Ensure Email/Password auth is enabled in Supabase Auth settings.

## Local Run
1. Start app: `npm run dev`.
2. Open app URL shown in terminal.

## Auth Flow
1. Open Signup page and create a new student account.
2. Confirm redirect to Chat page after signup/login.
3. Log out and log back in.
4. Confirm unauthenticated access to /chat redirects to /login.

## Chat Flow
1. Select Mathematics and send one question.
2. Confirm AI response is returned.
3. Switch to Science and send one question.
4. Switch to English and send one question.
5. Return to Mathematics and confirm previous messages persist.

## Validation Handling
1. Send a message with only spaces.
2. Confirm API rejects it and UI shows a clear error.
3. Send a message longer than 2000 characters.
4. Confirm API rejects it with a max-length message.

## Error Handling
1. Stop network or use invalid key and send a message.
2. Confirm user-friendly error appears in chat.

## Demo Pass Criteria
1. Signup works.
2. Login works.
3. Subject switching works.
4. At least one AI response per subject works.
5. Chat history persists per subject.
6. Empty message is rejected.
7. Oversized message is rejected.
