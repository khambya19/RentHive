const pool = require('../config/database');

async function createNotificationsTable() {
  try {
    // Create notification type enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Drop existing table if it exists
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');

    // Create notifications table
    await pool.query(`
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
      )
    `);

    // Add indexes
    await pool.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX idx_notifications_is_broadcast ON notifications(is_broadcast);
      CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
    `);

    // Create trigger
    await pool.query(`
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
    `);

    console.log('✅ Notifications table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    process.exit(1);
  }
}

createNotificationsTable();
