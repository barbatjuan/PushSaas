-- Remove OneSignal legacy column from notifications table
-- This column is no longer used since we switched to native Web Push API

-- Remove the column (this will also remove any data in it)
ALTER TABLE notifications DROP COLUMN IF EXISTS onesignal_notification_id;

-- Verify the column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;
