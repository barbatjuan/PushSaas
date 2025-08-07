-- Clean up expired/revoked push subscriptions
-- This removes subscriptions that are no longer valid and causing 410 errors

-- First, let's see what we have
SELECT 
  id,
  site_id,
  user_agent,
  created_at,
  CASE 
    WHEN subscription_data::text LIKE '%wns%' THEN 'Windows/Edge'
    WHEN subscription_data::text LIKE '%mozilla%' THEN 'Firefox'
    WHEN subscription_data::text LIKE '%chrome%' THEN 'Chrome'
    WHEN subscription_data::text LIKE '%android%' THEN 'Android'
    ELSE 'Unknown'
  END as browser_type
FROM push_subscriptions 
ORDER BY created_at DESC;

-- Delete all current subscriptions (they seem to be expired)
-- Users will need to re-subscribe with fresh tokens
DELETE FROM push_subscriptions;

-- Also clean up the subscribers table to keep counts accurate
DELETE FROM subscribers WHERE site_id = 'c5084858-dce0-4bd9-b9af-60ad65f94de3';

-- Verify cleanup
SELECT COUNT(*) as remaining_subscriptions FROM push_subscriptions;
SELECT COUNT(*) as remaining_subscribers FROM subscribers;
