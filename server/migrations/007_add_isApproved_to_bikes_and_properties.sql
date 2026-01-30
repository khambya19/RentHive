-- Add isApproved column to bikes and properties tables
ALTER TABLE bikes ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT FALSE;
