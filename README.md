## Cleaning Checklist MVP

Mobile-first Airbnb cleaning checklist for maids, with an admin area for Eva.

### Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)

### Setup

- **1) Create a Supabase project**
  - Enable Email/Password auth
  - Create users for Eva (admin) + Maid

- **2) Apply database schema**
  - Run SQL in `supabase/migrations/001_init.sql`
  - (Optional) seed with `supabase/seed.sql`
  - Create `profiles` rows for your users (same `id` as `auth.users.id`), set `role` to `admin` or `maid`

- **3) Configure env**
  - Copy `.env.example` → `.env.local`
  - Fill in:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **4) Run the app**

```bash
npm run dev
```

Open `http://localhost:3000`.

### Main routes

- **Login**: `/login`
- **Admin**: `/admin` (checklist, note, history)
- **Maid**: `/maid` (start/continue) and `/maid/cleaning/[id]` (checklist session)

