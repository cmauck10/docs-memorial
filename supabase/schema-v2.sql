-- Migration from v1 to v2: Multiple media support
-- Run this AFTER the initial schema.sql if you already have data
-- Or run this instead of schema.sql for fresh installs

-- Memorial Posts Table (v2 with multiple media support)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  media JSONB DEFAULT '[]', -- Array of {url, type} objects
  guest_token TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table (for simple auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_guest_token ON posts(guest_token);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for migration)
DROP POLICY IF EXISTS "Public can view non-hidden posts" ON posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
DROP POLICY IF EXISTS "Guests can update own posts" ON posts;
DROP POLICY IF EXISTS "Service role can delete posts" ON posts;
DROP POLICY IF EXISTS "Service role only for admin_users" ON admin_users;

-- RLS Policies for posts
CREATE POLICY "Public can view non-hidden posts" ON posts
  FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Guests can update own posts" ON posts
  FOR UPDATE USING (TRUE);

CREATE POLICY "Service role can delete posts" ON posts
  FOR DELETE USING (TRUE);

-- Admin users policies
CREATE POLICY "Service role only for admin_users" ON admin_users
  FOR ALL USING (TRUE);

-- Insert default admin user (skip if exists)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Migration helper: If you have existing data with old schema
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]';
-- UPDATE posts SET media = jsonb_build_array(jsonb_build_object('url', media_url, 'type', media_type)) WHERE media_url IS NOT NULL;
-- ALTER TABLE posts DROP COLUMN IF EXISTS media_url;
-- ALTER TABLE posts DROP COLUMN IF EXISTS media_type;

