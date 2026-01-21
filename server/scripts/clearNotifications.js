const pool = require('../config/db');

async function clearNotifications() {
  try {
    const result = await pool.query('DELETE FROM notifications');
    console.log(`✅ Deleted ${result.rowCount} notifications`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    process.exit(1);
  }
}

clearNotifications();
