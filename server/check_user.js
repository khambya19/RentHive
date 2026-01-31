const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUser(email, password) {
    try {
        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            console.log(`User not found: ${email}`);
            return;
        }
        console.log(`User found: ${user.email}`);
        console.log(`Type: ${user.type}`);
        console.log(`Verified: ${user.isVerified}`);
        console.log(`Blocked: ${user.isBlocked}`);

        if (password) {
            const match = await bcrypt.compare(password, user.password);
            console.log(`Password match: ${match}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

const email = process.argv[2];
const password = process.argv[3];
if (!email) {
    console.log('Usage: node check_user.js <email> [password]');
    process.exit();
}

checkUser(email, password);
