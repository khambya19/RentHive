-- Add metadata column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN notifications.metadata IS 'JSON string containing additional notification data like booking details for actionable notifications';
