# Security Policy

We take the security of AI Canva seriously. Thanks for helping keep it safe for everyone.

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅                 |
| older   | ❌                 |

We focus security fixes on the latest release. If you're running a fork or older version, please
upgrade before relying on fixes.

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.** Please report it privately.

- Open a **private vulnerability report** on GitHub: the repo's **Security** tab →
  **Report a vulnerability**.
- If you cannot use GitHub's private reporting, email the maintainer directly with the subject
  `[SECURITY] <short description>`.

Please include:

1. A description of the vulnerability and its impact.
2. Steps to reproduce (minimal, if possible).
3. Affected versions/endpoints/files.
4. Any proposed fix (optional).

### What happens next

- We'll acknowledge your report within 5 business days.
- We'll keep you informed as we triage and fix it.
- We'll credit you in the release notes (if you want to be credited).

## Security notes for self-hosters

The app is designed to be self-hosted. Before deploying publicly, review these:

- **API keys** live in `server/.env` / `functions/.env` (Ollama, fal.ai, Stitch). Never commit
  these or share them. Any public deployment with AI endpoints must protect them server-side.
- **Firestore rules** (`firestore.rules`) currently contain a permissive placeholder that lets any
  signed-in user read/update any board. **Tighten these before a public deploy** — see
  [docs/OSS_READINESS.md](docs/OSS_READINESS.md) for the recommended ownership/collaborator rules.
- **Firebase web config** is currently hardcoded in `client/src/lib/firebase.ts`. Before open
  hosting, move it to environment variables and point it at your own Firebase project.
- **Storage rules** (`storage.rules`) allow any signed-in user to write to board image paths.
  Consider tightening path ownership if you deploy publicly.

## Environment / secret handling

- `.env` files are git-ignored. Never commit them.
- The repo ships `.env.example` files as templates only.
- AI generation endpoints are not rate-limited; consider adding rate limiting if you expose them
  publicly.
