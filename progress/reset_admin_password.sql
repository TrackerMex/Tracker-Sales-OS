-- Reset admin password to "admin123"
UPDATE users
SET password_hash = '$2b$10$MtOXkmvZIgI1CDeH6pN41O8MkIlUIjJqOYBB6AGS8l9M631H3fsSK'
WHERE username = 'admin';

-- Verify
SELECT username, LEFT(password_hash, 30) as hash_preview, role, active
FROM users
WHERE username = 'admin';
