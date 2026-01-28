const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with better error handling and multiple auth options
const createTransporter = () => {
  const config = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add these options for better Gmail compatibility
    secure: true,
    port: 465,
    logger: true,
    debug: false
  };

  // If OAuth2 credentials are provided, use OAuth2 instead
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    config.auth = {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN
    };
  }

  return nodemailer.createTransport(config);
};

const transporter = createTransporter();

async function sendEmail({ to, subject, html, text }) {
  try {
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter is ready');
    
    const info = await transporter.sendMail({
      from: `"RentHive" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text
    });
    
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = sendEmail;
