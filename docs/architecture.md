# Architecture

Memory Kiss has two modes.

## Local Mode

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app uses browser local storage. This keeps the demo easy to run without accounts, but links only work in the same browser.

## Supabase Mode

When Supabase environment variables are set, Memory Kiss uses:

- Supabase Auth for creator sign-in with email magic links
- Postgres tables for kisses and memories
- Row-level security for creator-owned writes and admin reads
- Public SQL RPC functions for recipient reveal links
- Supabase Storage for uploaded photos

## Link Model

The app separates admin links from recipient links:

- `/upload/:id` uses the internal kiss ID and is for the authenticated creator.
- `/kiss/:shareToken` uses a separate random share token and is public for the recipient.

This keeps the recipient experience account-free while preventing a leaked reveal link from becoming an edit link.

## Data Model

`kisses` stores creator-owned share containers:

- `id`
- `owner_id`
- `share_token`
- `sender_name`
- `created_at`

`memories` stores photos and captions:

- `id`
- `kiss_id`
- `owner_id`
- `photo_url`
- `caption`
- `created_at`

## Privacy Tradeoff

The v1 storage bucket is public so public reveal pages can render uploaded images without a server. This is acceptable for a simple share-link app, but not for highly sensitive photos.

For stronger privacy, use a private storage bucket and return short-lived signed URLs from a server-side function after validating the reveal token.
