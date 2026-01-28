-- Add name column to bikes table (PostgreSQL syntax)
ALTER TABLE bikes ADD COLUMN name VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN bikes.name IS 'Display name for the bike listing';

-- Update existing bikes to have a name based on brand and model
UPDATE bikes SET name = CONCAT(brand, ' ', model) WHERE name IS NULL;