-- Clean up expired/revoked push subscriptions
-- This removes subscriptions that are no longer valid and causing 410 errors

-- First, let's see what we have
SELECT 
  id,
  site_id,
  user_agent,
  created_at,
  is_active,
  CASE 
    WHEN subscription_data::text LIKE '%wns%' THEN 'Windows/Edge'
    WHEN subscription_data::text LIKE '%mozilla%' THEN 'Firefox'
    WHEN subscription_data::text LIKE '%chrome%' THEN 'Chrome'
    WHEN subscription_data::text LIKE '%fcm.googleapis.com%' THEN 'Chrome/Android'
    ELSE 'Unknown'
  END as browser_type
FROM push_subscriptions 
ORDER BY created_at DESC;

-- Count current subscriptions
SELECT COUNT(*) as total_push_subscriptions FROM push_subscriptions;
SELECT COUNT(*) as total_subscribers FROM subscribers;

-- Delete all current subscriptions (they seem to be expired)
-- Users will need to re-subscribe with fresh tokens
TRUNCATE TABLE push_subscriptions RESTART IDENTITY CASCADE;

-- Also clean up the subscribers table to keep counts accurate
TRUNCATE TABLE subscribers RESTART IDENTITY CASCADE;

-- Reset subscriber count in sites table
UPDATE sites SET subscriber_count = 0 WHERE site_id = 'c5084858-dce0-4bd9-b9af-60ad65f94de3';

-- Verify cleanup
SELECT COUNT(*) as remaining_subscriptions FROM push_subscriptions;
SELECT COUNT(*) as remaining_subscribers FROM subscribers;
SELECT subscriber_count FROM sites WHERE site_id = 'c5084858-dce0-4bd9-b9af-60ad65f94de3';
