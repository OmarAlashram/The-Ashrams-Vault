# The Ashrams Vault

A private family document vault, installed to the iPhone home screen as a PWA.

**Phase 1 (this commit):** sign-in by emailed link, document list with search, upload with category, owner and passport expiry, private file storage.

Not yet built: importing the existing Excel tracker, OCR, AI assistant, timeline and health history.

## Stack

- Next.js 14 (App Router), installable as a PWA
- Supabase: email-link auth, Postgres with row-level security, private storage bucket
- Hosting: Vercel

## Setup

1. **Supabase.** Create a project. In SQL Editor, run `supabase/schema.sql`. Then in Authentication → Providers → Email, turn off "Allow new users to sign up", so only invited addresses can log in. Invite your and your wife's emails under Authentication → Users.
2. **Local env.** Copy `.env.example` to `.env.local` and fill in the project URL and anon key from Settings → API.
3. **Install and run.** `npm install`, then `npm run dev`, then open http://localhost:3000.
4. **Deploy.** Import the repo into Vercel, add the same two environment variables, and deploy. Add the Vercel URL to Supabase under Authentication → URL Configuration (Site URL and Redirect URLs, including `/auth/callback`).
5. **iPhone.** Open the Vercel URL in Safari, tap Share → Add to Home Screen.

## Security notes

- Files live in a private bucket; the app opens them with 5-minute signed links.
- Every table and file is behind sign-in and row-level security.
- Sign-ups are disabled, so no one outside the invite list can get in.
- Enable two-factor authentication on the Supabase and GitHub accounts.

## Icons

`public/icons/` is empty. Add `icon-192.png` and `icon-512.png` and reference them in `public/manifest.webmanifest` for a proper home-screen icon.
