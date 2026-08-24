-- Preserve existing employee IDs and assign CFG IDs only to users missing one.
-- Run once against the ConfigFlow database.
SET @employee_sequence = (
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 5) AS UNSIGNED)), 0)
    FROM users
    WHERE employee_id REGEXP '^CFG-[0-9]+$'
);

UPDATE users
SET employee_id = CONCAT(
    'CFG-',
    LPAD((@employee_sequence := @employee_sequence + 1), 4, '0')
)
WHERE employee_id IS NULL
ORDER BY id;
