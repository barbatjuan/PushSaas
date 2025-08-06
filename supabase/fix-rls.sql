-- Disable RLS for all tables to work with Clerk authentication
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own sites" ON sites;
DROP POLICY IF EXISTS "Users can insert own sites" ON sites;
DROP POLICY IF EXISTS "Users can update own sites" ON sites;
DROP POLICY IF EXISTS "Public can insert subscribers" ON subscribers;
DROP POLICY IF EXISTS "Users can view subscribers of own sites" ON subscribers;
DROP POLICY IF EXISTS "Users can view notifications of own sites" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for own sites" ON notifications;
