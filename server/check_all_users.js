const User = require('./models/User');

async function checkAllUsers() {
    try {
        const users = await User.findAll();

        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.type || u.role}, Name: ${u.fullName}`);
        });
        console.log('-----------------');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAllUsers();
