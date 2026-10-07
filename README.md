# THANAL – Tree Planting & Monitoring System

NSS/NRPF volunteer scheduling, 21-day birthday-based activity window, evidence tracking and
Volunteer Secretary (VS) unit governance. React + Vite + Supabase.

## 1. Supabase setup (SQL Editor, run in this order)
1. `supabase_registration_setup.sql` – units + registration policies (once)
2. `sql/1_reject_volunteer.sql` – rejecting a volunteer deletes everything about them
3. `sql/2_short_ids.sql` – IDs like `141-24-V001` (unit-batch-number) and `141-VS`
   (if volunteers already exist, set their batch first – see the comment in the file)
4. `sql/3_notification_log.sql` – log of emails that were really sent
5. Optional: `sql/4_one_vs_per_unit_optional.sql` – database refuses a 2nd VS in a unit
6. `is_vs_email_allowed` must whitelist only the one VS email.
7. Authentication → URL Configuration: add your deployed site URL.

## 2. Emails (Google Apps Script)
`apps-script/ThanalMailer.gs` sends the Day-1 window reminder and the birthday wish every
day from a Gmail account and records each real send. Setup steps are at the top of the file.
The service_role key lives only in the script's properties, never in this repo.

## 3. Run locally
```
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev
```

## 4. Deploy (Netlify / Cloudflare Pages / Vercel)
- Build command: `npm run build`   Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Notes
- Only one VS per unit; there is no Chief VS role.
- Batches offered at registration are listed in `batches.ts` (update each year).
- Shown IDs come from `displayId()` in `ThanalContext.tsx`.
