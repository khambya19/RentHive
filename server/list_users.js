const User = require('./models/User');

async function listUsers() {
    try {
        const users = await User.findAll();
        console.log(`Total users found: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.email} (${u.type}, Verified: ${u.isVerified})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listUsers();
