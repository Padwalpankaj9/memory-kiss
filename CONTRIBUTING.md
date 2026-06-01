# Contributing

Thanks for considering a contribution to Memory Kiss.

## Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
npm run audit
```

## Pull Requests

- Keep changes focused.
- Include screenshots for user-facing UI changes.
- Do not commit real personal photos, real recipient data, `.env.local`, or Supabase service-role keys.
- Update `README.md` or `docs/architecture.md` when changing setup, auth, persistence, or deployment behavior.

## Supabase Changes

When changing database behavior, update `supabase/schema.sql` and describe any migration impact in the pull request.
