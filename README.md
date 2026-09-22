# গ্রামসেবা Investor App — Vercel Starter

এটি একটি **prototype/starter**। বাস্তব টাকা গ্রহণ, custody, withdrawal বা guaranteed return দেওয়ার জন্য সরাসরি ব্যবহার করার আগে আইনগত/নিয়ন্ত্রক যাচাই এবং server-side financial controls প্রয়োজন।

## Features
- Google/Gmail login
- 1 Unit = ৳1,000
- 1–100 Unit selector
- Investor dashboard নেই
- Admin-only panel
- Business income input
- Investor return allocation percentage
- Investor list
- Income run ledger
- Firestore rules starter

## Vercel deployment
1. Firebase Console-এ একটি Web App তৈরি করুন।
2. Authentication → Sign-in method → Google চালু করুন।
3. Firestore Database চালু করুন।
4. `.env.example` কপি করে `.env.local` বানান এবং Firebase config বসান।
5. `NEXT_PUBLIC_ADMIN_EMAIL`-এ আপনার Admin Gmail দিন।
6. `firestore.rules`-এর `REPLACE_WITH_YOUR_ADMIN_GMAIL`-এ একই Gmail বসান।
7. GitHub-এ project upload করে Vercel থেকে Import করুন।
8. Vercel Project Settings → Environment Variables-এ `.env.local`-এর সব values যোগ করুন।
9. Deploy করুন।

## গুরুত্বপূর্ণ
Return calculation-এর UI আছে, কিন্তু প্রকৃত investor wallet posting starter version-এ intentionally server-side করা হয়নি। প্রকৃত অর্থ/return ledger-এর জন্য Cloud Functions বা অন্য trusted backend transaction ব্যবহার করা উচিত।
