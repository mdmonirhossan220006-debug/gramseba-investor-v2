# গ্রামসেবা Investor App — Vercel/Next.js

এই version-এ frontend Next.js `app/` structure-এ রাখা হয়েছে, তাই Vercel-এর `Couldn't find any 'pages' or 'app' directory` build error আর হওয়ার কথা নয়।

## Required Vercel Environment Variables

Production environment-এ এগুলো যোগ করুন:

- `BLOB_READ_WRITE_TOKEN` — Vercel Blob Store-এর token
- `ADMIN_EMAIL` — Admin login email
- `ADMIN_PASSWORD` — Admin login password
- `ADMIN_SECRET` — দীর্ঘ random secret
- `INVESTOR_EMAIL` — Investor login email
- `INVESTOR_PASSWORD` — Investor login password

তারপর **Redeploy** করুন।

## Project structure

- `app/page.js` — Investor dashboard
- `app/layout.js` — Next.js root layout
- `app/globals.css` — global styles
- `api/[...path].js` — Vercel API handler
- `public/` — public assets
- `package.json` — Next.js dependencies
