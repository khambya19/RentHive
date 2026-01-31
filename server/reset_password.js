const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function resetPassword(email, newPassword) {
    try {
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            console.log(`User not found: ${email}`);
            return;
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        console.log(`Password for ${email} has been reset to: ${newPassword}`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
    console.log('Usage: node reset_password.js <email> <new_password>');
    process.exit();
}

resetPassword(email, password);
