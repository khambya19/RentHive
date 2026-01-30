const db = require('../config/db');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node fixAndVerifyUser.js <email>');
  process.exit(1);
}

(async () => {
  try {
    console.log('Syncing database with alter option...');
    await db.sync({ alter: true });
    console.log('✅ Database synced');
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log('\n📋 User Details:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Type:', user.type);
    console.log('isVerified:', user.isVerified);
    
    if (user.isVerified) {
      console.log('\n✅ User is already verified');
    } else {
      console.log('\n⚠️  User is NOT verified');
      console.log('Setting isVerified to true...');
      
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      
      console.log('✅ User has been verified successfully!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
