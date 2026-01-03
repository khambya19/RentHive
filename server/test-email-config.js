const sendEmail = require('./utils/mailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
  
  try {
    const result = await sendEmail({
      to: 'khadkarjn77@gmail.com',
      subject: 'RentHive Email Test',
      html: '<h2>Test Email</h2><p>If you receive this, your email configuration is working!</p>'
    });
    console.log('Email test successful!');
  } catch (error) {
    console.error('Email test failed:', error.message);
  }
}

testEmail();