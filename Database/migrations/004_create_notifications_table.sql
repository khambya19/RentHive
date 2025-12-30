-- Migration: Create notifications table
-- Description: Creates table for storing user notifications and broadcast notifications

-- Drop table if exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_broadcast BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_broadcast ON notifications(is_broadcast);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores user-specific and broadcast notifications';
COMMENT ON COLUMN notifications.user_id IS 'User ID - NULL for broadcast notifications';
COMMENT ON COLUMN notifications.is_broadcast IS 'TRUE if notification is sent to all users';
COMMENT ON COLUMN notifications.link IS 'Optional URL to navigate when notification is clicked';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at_trigger
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Insert sample notifications for testing (optional)
-- INSERT INTO notifications (user_id, title, message, type, is_broadcast) 
-- VALUES (1, 'Welcome to RentHive', 'Thank you for joining RentHive!', 'success', false);
