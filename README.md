# Docs Memorial

A memorial for the amazing Dr. Michael Mauck.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor
3. Set up Storage bucket named `media` with public access
4. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Memorial Wall**: View all tribute posts in a beautiful grid layout
- **Submit Tributes**: Guests can share messages and upload photos/videos
- **Guest Editing**: Guests can edit their own posts from the same device
- **Admin Panel**: Protected admin area to manage all posts (`/admin`)

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Or connect your GitHub repo to Vercel for automatic deployments.
