SELECT COUNT(*) 
FROM entities 
WHERE description IS NULL OR description = '';
