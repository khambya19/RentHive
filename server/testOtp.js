require('dotenv').config();
const nodemailer = require('nodemailer');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

async function sendTestOTPEmail() {
  const otp = generateOTP();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  
      pass: process.env.EMAIL_PASS   
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,       
    subject: 'RentHive OTP Test',
    text: `Your OTP is: ${otp}. It will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    console.log('Generated OTP:', otp);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

sendTestOTPEmail();
