-- Add logo_url column to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sites.logo_url IS 'URL of the company logo for push notifications';
