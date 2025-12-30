/**
 * Test Script for RentHive Notification System
 * 
 * This script helps you test the notification system by sending test notifications.
 * Run this after starting your server to test the notification functionality.
 * 
 * Usage:
 *   node testNotifications.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/notifications';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function to log with colors
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
};

// Test Functions
async function testBroadcastNotification() {
  log.test('Testing Broadcast Notification...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/broadcast`, {
      title: 'System Announcement',
      message: 'Welcome to RentHive notification system! This is a test broadcast.',
      type: 'info',
      link: '/'
    });
    
    if (response.data.success) {
      log.success('Broadcast notification sent successfully!');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    log.error('Failed to send broadcast notification');
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testUserNotification(userId = 1) {
  log.test(`Testing User Notification for user ${userId}...`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/user`, {
      userId: userId,
      title: 'Welcome to RentHive!',
      message: 'Thank you for joining RentHive. Start exploring properties now!',
      type: 'success',
      link: '/properties'
    });
    
    if (response.data.success) {
      log.success(`User notification sent successfully to user ${userId}!`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    log.error(`Failed to send user notification to user ${userId}`);
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testGetNotifications(userId = 1) {
  log.test(`Testing Get Notifications for user ${userId}...`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    
    if (response.data.success) {
      log.success(`Retrieved notifications for user ${userId}`);
      console.log(`   Total: ${response.data.data.total}`);
      console.log(`   Unread: ${response.data.data.unreadCount}`);
      console.log('   Notifications:', response.data.data.notifications);
    }
  } catch (error) {
    log.error(`Failed to get notifications for user ${userId}`);
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testMarkAsRead(notificationId, userId = 1) {
  log.test(`Testing Mark as Read for notification ${notificationId}...`);
  
  try {
    const response = await axios.patch(`${API_BASE_URL}/${notificationId}/read`, {
      userId: userId
    });
    
    if (response.data.success) {
      log.success('Notification marked as read!');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    log.error('Failed to mark notification as read');
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testMarkAllAsRead(userId = 1) {
  log.test(`Testing Mark All as Read for user ${userId}...`);
  
  try {
    const response = await axios.patch(`${API_BASE_URL}/user/${userId}/read-all`);
    
    if (response.data.success) {
      log.success('All notifications marked as read!');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    log.error('Failed to mark all notifications as read');
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testDeleteNotification(notificationId, userId = 1) {
  log.test(`Testing Delete Notification ${notificationId}...`);
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/${notificationId}`, {
      data: { userId: userId }
    });
    
    if (response.data.success) {
      log.success('Notification deleted!');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    log.error('Failed to delete notification');
    console.error('   Error:', error.response?.data || error.message);
  }
}

async function testAllNotificationTypes(userId = 1) {
  log.test('Testing All Notification Types...');
  
  const types = [
    { type: 'info', title: 'Information', message: 'This is an info notification' },
    { type: 'success', title: 'Success!', message: 'This is a success notification' },
    { type: 'warning', title: 'Warning', message: 'This is a warning notification' },
    { type: 'error', title: 'Error', message: 'This is an error notification' }
  ];
  
  for (const notif of types) {
    try {
      await axios.post(`${API_BASE_URL}/user`, {
        userId: userId,
        ...notif
      });
      log.success(`${notif.type.toUpperCase()} notification sent`);
      await sleep(500); // Wait a bit between notifications
    } catch (error) {
      log.error(`Failed to send ${notif.type} notification`);
    }
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log.info('RentHive Notification System Test Suite');
  console.log('='.repeat(60) + '\n');
  
  const userId = 1; // Change this to test with different users
  
  // Run tests
  await testBroadcastNotification();
  await sleep(1000);
  
  await testUserNotification(userId);
  await sleep(1000);
  
  await testAllNotificationTypes(userId);
  await sleep(1000);
  
  await testGetNotifications(userId);
  await sleep(1000);
  
  // Uncomment these to test mark as read and delete
  // await testMarkAsRead(1, userId);
  // await sleep(1000);
  
  // await testMarkAllAsRead(userId);
  // await sleep(1000);
  
  // await testDeleteNotification(1, userId);
  
  console.log('\n' + '='.repeat(60));
  log.success('Test suite completed!');
  console.log('='.repeat(60) + '\n');
  
  log.info('Next steps:');
  console.log('1. Open your browser and check the notification bell');
  console.log('2. You should see all the test notifications');
  console.log('3. Try clicking on notifications to mark them as read');
  console.log('4. Try deleting notifications');
  console.log('\n');
}

// Check if running directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  const userId = parseInt(args[1]) || 1;
  const notificationId = parseInt(args[2]) || 1;
  
  switch (command) {
    case 'broadcast':
      testBroadcastNotification();
      break;
    case 'user':
      testUserNotification(userId);
      break;
    case 'get':
      testGetNotifications(userId);
      break;
    case 'read':
      testMarkAsRead(notificationId, userId);
      break;
    case 'read-all':
      testMarkAllAsRead(userId);
      break;
    case 'delete':
      testDeleteNotification(notificationId, userId);
      break;
    case 'types':
      testAllNotificationTypes(userId);
      break;
    default:
      runAllTests();
  }
}

module.exports = {
  testBroadcastNotification,
  testUserNotification,
  testGetNotifications,
  testMarkAsRead,
  testMarkAllAsRead,
  testDeleteNotification,
  testAllNotificationTypes
};
