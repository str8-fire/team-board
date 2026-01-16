# Work Board

A real-time collaborative task board for internal teams. Built with Next.js and Supabase.

## Features

- Four-column board: Doing, Blocked, Need Help, Done
- Real-time sync across multiple users/tabs
- Historical task tracking with daily boards
- Automatic task carryover between days
- Activity pulse showing recent updates
- Offline mode with localStorage fallback
- Person filtering

## Getting Started

### 1. Set up Supabase (Optional - for real-time sync)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API
4. Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

Note: The app works without Supabase using localStorage only.

### 2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Architecture

### Data Flow

1. **UI Components** (`app/page.tsx`) - React components for the board UI
2. **Hooks** (`hooks/useTasks.ts`, `hooks/useActivity.ts`) - Data layer with real-time subscriptions
3. **Supabase Client** (`lib/supabase.ts`) - Database connection with offline fallback
4. **Database Types** (`lib/database.types.ts`) - TypeScript types for tasks and activities

### Real-time Sync

The app uses Supabase's real-time subscriptions to sync changes across clients:
- INSERT, UPDATE, DELETE events on the `tasks` table
- INSERT events on the `activities` table

Changes are applied optimistically (UI updates immediately, then syncs with server).

### Offline Mode

When Supabase is unavailable or not configured:
- Data is stored in localStorage
- An "Offline" badge appears in the header
- All features work locally

## Extending the App

### Adding Authentication

1. Enable auth in your Supabase project
2. Update RLS policies in `supabase/schema.sql`
3. Add auth context/hooks to the app
4. Filter tasks by user in queries

### Adding Permissions

1. Add a `user_id` column to the tasks table
2. Update RLS policies to check user ownership
3. Add team/workspace support if needed

### Scaling

- Add indexes for frequently queried columns
- Consider partitioning tasks by date for large datasets
- Use Supabase Edge Functions for complex operations
