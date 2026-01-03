#!/bin/bash

# Simple script to delete a user by email from PostgreSQL
# Usage: ./delete-user.sh email@example.com

if [ $# -eq 0 ]; then
    echo "Usage: ./delete-user.sh <email>"
    echo "Example: ./delete-user.sh test@example.com"
    exit 1
fi

EMAIL=$1

echo "Deleting user with email: $EMAIL"

# Source environment variables
source .env

# Connect to PostgreSQL and delete user
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
BEGIN;
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email = '$EMAIL');
DELETE FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email = '$EMAIL') OR lessor_id IN (SELECT id FROM lessors WHERE email = '$EMAIL');
DELETE FROM property_views WHERE user_id IN (SELECT id FROM users WHERE email = '$EMAIL');
DELETE FROM inquiries WHERE user_id IN (SELECT id FROM users WHERE email = '$EMAIL');
DELETE FROM bikes WHERE vendor_id IN (SELECT id FROM vendors WHERE email = '$EMAIL');
DELETE FROM bike_bookings WHERE vendor_id IN (SELECT id FROM vendors WHERE email = '$EMAIL');
DELETE FROM properties WHERE lessor_id IN (SELECT id FROM lessors WHERE email = '$EMAIL');
DELETE FROM users WHERE email = '$EMAIL';
DELETE FROM vendors WHERE email = '$EMAIL';
DELETE FROM lessors WHERE email = '$EMAIL';
COMMIT;
"

echo "✅ Deletion completed for email: $EMAIL"