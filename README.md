# Gramseba Investor App — Vercel

This version is converted from Netlify Functions/Blobs to Vercel Functions + Vercel Blob.

## Vercel setup
1. Import this project into Vercel.
2. Create a **Vercel Blob** store and connect it to the project. This supplies `BLOB_READ_WRITE_TOKEN`.
3. Add environment variables:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SECRET`
   - `INVESTOR_EMAIL`
   - `INVESTOR_PASSWORD`
4. Redeploy.

Default investor: `investor@gramseba.com` / `Investor@2026!` if env vars are not set.

## Profit calculation
The investor dashboard now shows:
- investment amount
- cumulative verified business sales
- cumulative business expenses
- cumulative net business profit
- investor profit = cumulative net profit × investor share %
- total value = investment + investor profit

Example: investment ৳2,000,000, share 20%, cumulative net business profit ৳500,000 => investor profit ৳100,000 and total ৳2,100,000.

The profit is calculated from **verified** orders only and subtracts recorded expenses. It is not a guaranteed return.
