UPDATE tab
SET col = 1
WHERE col = 1;

UPDATE LOW_PRIORITY tab
SET col = 1;

UPDATE tab
SET col = 1
ORDER BY col
LIMIT 10;
