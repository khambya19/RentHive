const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
});

async function deleteUserByEmail(email) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check which tables contain the email
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        const vendorCheck = await client.query('SELECT id FROM vendors WHERE email = $1', [email]);
        const lessorCheck = await client.query('SELECT id FROM lessors WHERE email = $1', [email]);
        
        let deletedFrom = [];
        
        // Delete from users table
        if (userCheck.rows.length > 0) {
            const userId = userCheck.rows[0].id;
            
            // Delete related records first (to avoid foreign key constraints)
            await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM property_views WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM inquiries WHERE user_id = $1', [userId]);
            
            // Delete the user
            await client.query('DELETE FROM users WHERE email = $1', [email]);
            deletedFrom.push('users');
        }
        
        // Delete from vendors table
        if (vendorCheck.rows.length > 0) {
            const vendorId = vendorCheck.rows[0].id;
            
            // Delete related records first
            await client.query('DELETE FROM bikes WHERE vendor_id = $1', [vendorId]);
            await client.query('DELETE FROM bike_bookings WHERE vendor_id = $1', [vendorId]);
            
            // Delete the vendor
            await client.query('DELETE FROM vendors WHERE email = $1', [email]);
            deletedFrom.push('vendors');
        }
        
        // Delete from lessors table
        if (lessorCheck.rows.length > 0) {
            const lessorId = lessorCheck.rows[0].id;
            
            // Delete related records first
            await client.query('DELETE FROM properties WHERE lessor_id = $1', [lessorId]);
            await client.query('DELETE FROM bookings WHERE lessor_id = $1', [lessorId]);
            
            // Delete the lessor
            await client.query('DELETE FROM lessors WHERE email = $1', [email]);
            deletedFrom.push('lessors');
        }
        
        await client.query('COMMIT');
        
        if (deletedFrom.length > 0) {
            console.log(`✅ Successfully deleted email "${email}" from: ${deletedFrom.join(', ')}`);
        } else {
            console.log(`ℹ️  Email "${email}" not found in any table`);
        }
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting user:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node deleteTestUser.js <email>');
    console.log('Example: node deleteTestUser.js test@example.com');
    process.exit(1);
}

deleteUserByEmail(email)
    .then(() => {
        console.log('Operation completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to delete user:', error.message);
        process.exit(1);
    });