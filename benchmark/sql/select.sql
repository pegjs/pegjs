SELECT 1;

SELECT *, tab.*, col, `col`, 1 as one, 's' string
FROM tab, tab tab2 -- alias
INNER JOIN tab AS tab3 ON tab.col = tab3.col /* join */
WHERE col = 's' AND `col` = `col`
ORDER BY col DESC
LIMIT 10;

SELECT DISTINCT col FROM tab;

SELECT 1
UNION
SELECT 2;

SELECT (SELECT 1);
