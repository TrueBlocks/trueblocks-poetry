SELECT type_slug, COUNT(*) as count 
FROM entities 
GROUP BY type_slug 
ORDER BY count DESC;
