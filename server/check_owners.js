const User = require('./models/User');

async function checkOwners() {
    try {
        const owners = await User.findAll({
            where: {
                type: 'owner'
            }
        });

        console.log('--- OWNER ACCOUNTS ---');
        owners.forEach(u => {
            console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.fullName}`);
        });
        console.log('----------------------');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkOwners();
