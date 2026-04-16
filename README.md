# DevOps Task Tracker

A full-stack DevOps task dashboard built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your Supabase values:

```bash
cp .env.example .env.local
```

3. In Supabase SQL Editor, run:

```sql
-- paste the contents of supabase/schema.sql
```

4. Start the app:

```bash
npm run dev
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If these env vars are not set, the app falls back to local dummy task data so the UI still runs.
