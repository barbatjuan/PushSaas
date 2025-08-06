-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    site_id TEXT UNIQUE NOT NULL,
    onesignal_app_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    expires_at TIMESTAMP WITH TIME ZONE,
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(site_id, token)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    url TEXT,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    onesignal_notification_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_site_id ON subscribers(site_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_token ON subscribers(token);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_site_id ON notifications(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update subscriber count
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE sites 
        SET subscriber_count = (
            SELECT COUNT(*) 
            FROM subscribers 
            WHERE site_id = NEW.site_id AND is_active = true
        )
        WHERE site_id = NEW.site_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE sites 
        SET subscriber_count = (
            SELECT COUNT(*) 
            FROM subscribers 
            WHERE site_id = NEW.site_id AND is_active = true
        )
        WHERE site_id = NEW.site_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE sites 
        SET subscriber_count = (
            SELECT COUNT(*) 
            FROM subscribers 
            WHERE site_id = OLD.site_id AND is_active = true
        )
        WHERE site_id = OLD.site_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update subscriber count
CREATE TRIGGER update_subscriber_count_insert AFTER INSERT ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

CREATE TRIGGER update_subscriber_count_update AFTER UPDATE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

CREATE TRIGGER update_subscriber_count_delete AFTER DELETE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Sites policies
CREATE POLICY "Users can view own sites" ON sites
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can insert own sites" ON sites
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update own sites" ON sites
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    ));

-- Subscribers policies (public read for SDK)
CREATE POLICY "Public can insert subscribers" ON subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view subscribers of own sites" ON subscribers
    FOR SELECT USING (site_id IN (
        SELECT site_id FROM sites WHERE user_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    ));

-- Notifications policies
CREATE POLICY "Users can view notifications of own sites" ON notifications
    FOR SELECT USING (site_id IN (
        SELECT id FROM sites WHERE user_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    ));

CREATE POLICY "Users can insert notifications for own sites" ON notifications
    FOR INSERT WITH CHECK (site_id IN (
        SELECT id FROM sites WHERE user_id IN (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    ));

-- Insert admin user (replace with your actual Clerk ID)
-- INSERT INTO users (clerk_id, email, name, role, plan) 
-- VALUES ('your_clerk_admin_id', 'admin@example.com', 'Admin User', 'admin', 'paid')
-- ON CONFLICT (clerk_id) DO NOTHING;
