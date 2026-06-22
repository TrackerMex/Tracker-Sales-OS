-- Fix tasks.description column length
-- This script changes the description column from varchar(200) to text
-- to support longer task descriptions

-- Alter the description column to text type
ALTER TABLE tasks
ALTER COLUMN description TYPE text;

-- Verify the change
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'description';
