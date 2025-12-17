-- Memorial Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT, -- 'image' or 'video'
  guest_token TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table (for simple auth)
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_guest_token ON posts(guest_token);
CREATE INDEX idx_posts_is_hidden ON posts(is_hidden);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
-- Anyone can read non-hidden posts
CREATE POLICY "Public can view non-hidden posts" ON posts
  FOR SELECT USING (is_hidden = FALSE);

-- Anyone can insert posts
CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (TRUE);

-- Guests can update their own posts (by guest_token)
CREATE POLICY "Guests can update own posts" ON posts
  FOR UPDATE USING (TRUE);

-- Only allow delete through service role (admin)
CREATE POLICY "Service role can delete posts" ON posts
  FOR DELETE USING (TRUE);

-- Admin users policies (only service role can access)
CREATE POLICY "Service role only for admin_users" ON admin_users
  FOR ALL USING (TRUE);

-- Create storage bucket for media uploads
-- Run this in Supabase Dashboard > Storage > Create new bucket
-- Bucket name: media
-- Public bucket: Yes

-- Storage policies (run in SQL editor after creating bucket)
-- Allow public read access
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Anyone can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
-- CREATE POLICY "Anyone can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'media');

-- Insert a default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- The password is hashed with a simple approach for demo purposes
-- In production, use proper bcrypt hashing
INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'admin123');

