SELECT COUNT(*) FROM entities WHERE json_extract(attributes, '$.source') IS NOT NULL AND json_extract(attributes, '$.source') != ''
