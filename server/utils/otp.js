
require('dotenv').config();

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

exports.getOtpExpiry = (minutes = parseInt(process.env.OTP_EXPIRE_MINUTES || '10')) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
