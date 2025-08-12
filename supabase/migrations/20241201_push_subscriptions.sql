-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    subscription_hash VARCHAR(32) NOT NULL,
    subscription_data JSONB NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Create unique index to prevent duplicate subscriptions per site
    UNIQUE(site_id, subscription_hash)
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Auth user ID (Supabase)
    notification_data JSONB NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_site_id ON push_subscriptions(site_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(site_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_hash ON push_subscriptions(subscription_hash);

CREATE INDEX IF NOT EXISTS idx_notification_logs_site_id ON notification_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- First, alter the sites table to change user_id from UUID to TEXT (if it exists)
-- Nota: Este bloque existía por compatibilidad con IDs en texto; con Supabase se usa UUID en users.id, mantener solo si tu esquema lo requiere.
DO $$ 
BEGIN
    -- Check if sites table exists and has user_id as UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sites' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        -- Drop foreign key constraint if it exists
        ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_user_id_fkey;
        -- Change column type to TEXT
        ALTER TABLE sites ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;

-- RLS Policies for push_subscriptions
-- Allow site owners to read their subscriptions
CREATE POLICY "Site owners can read push subscriptions" ON push_subscriptions
    FOR SELECT USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

-- Allow public insert for new subscriptions (SDK needs this)
CREATE POLICY "Allow public insert for push subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (TRUE);

-- Allow site owners to update their subscriptions
CREATE POLICY "Site owners can update push subscriptions" ON push_subscriptions
    FOR UPDATE USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for notification_logs
-- Allow users to read their own notification logs
CREATE POLICY "Users can read their notification logs" ON notification_logs
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Allow users to insert their own notification logs
CREATE POLICY "Users can insert their notification logs" ON notification_logs
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Add helpful comments
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for each site';
COMMENT ON COLUMN push_subscriptions.subscription_hash IS 'Hash of the subscription endpoint for uniqueness';
COMMENT ON COLUMN push_subscriptions.subscription_data IS 'Full subscription object from browser PushManager';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether the subscription is still valid and active';

COMMENT ON TABLE notification_logs IS 'Logs of sent push notifications for analytics and history';
COMMENT ON COLUMN notification_logs.notification_data IS 'The notification payload that was sent';
COMMENT ON COLUMN notification_logs.total_sent IS 'Number of successful deliveries';
COMMENT ON COLUMN notification_logs.total_failed IS 'Number of failed deliveries';
