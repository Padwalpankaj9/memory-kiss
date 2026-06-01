# Security Policy

## Supported Versions

Security fixes are handled on the `main` branch until the project starts publishing versioned releases.

## Reporting a Vulnerability

Please report suspected vulnerabilities by opening a private security advisory on GitHub if available, or by contacting the maintainer directly.

Do not include exploit details, real private photos, access tokens, or service-role keys in a public issue.

## Security Notes

- Supabase service-role keys must never be exposed in the browser or committed to the repository.
- The public Supabase anon key is expected to be public, but row-level security must enforce all private write access.
- Reveal links are intentionally public for recipients. Treat them like private share links, not account-protected pages.
- The v1 storage bucket is public so reveal pages can load photos directly. For sensitive production use, move photos to a private bucket and serve signed URLs from a server-side endpoint.
