/*
 * SQL grammar recognizing four basic CRUD commands: SELECT, INSERT, UPDATE, DELETE.
 * SELECT recognizes joins, UNION and subselects.
 * INSERT recognizes ON DUPLICATE KEY UPDATE.
 *
 * The grammar allows using modifiers on various places, e.g.:
 * SELECT HUBBA BUBBA * FROM tab1 CRAZY BUBBLE JOIN tab2;
 * The modifiers are not hard-coded as different SQL implementations use different modifiers.
 *
 * The generated parser could be configured by passing object as the third parameter of the parse() method.
 * The object may have these keys and values:
 * quotes: 'string', 'idf' or 'none' // whether " is used for strings or identifiers
 *
 * Supports:
 * SQLite except index hints, INTERSECT, EXCEPT
 * MySQL except partitions, index hints, multi-table UPDATE and DELETE
 * PostgreSQL except WITH, RETURNING, multi-table UPDATE and DELETE
 */

{
  var config = arguments[2] || { };
}

queries
  = _ query? (";" queries)?

query
  = select other
  / insert
  / update
  / delete

other
  = (space / idf / string / [^;])*

insert
  = (INSERT / REPLACE) into

into
  = table ("(" columns ")" _)? select duplicate
  / table ("(" columns ")" _)? VALUES parens ("," parens)* duplicate
  / table SET set duplicate
  / table DEFAULT_VALUES
  / __ word into

set
  = column "=" ex ("," set)?

duplicate
  = (ON_DUPLICATE_KEY_UPDATE set)?

update
  = UPDATE updateset where? order? limit?

updateset
  = table SET set
  / __ word updateset

delete
  = DELETE __ deletefrom where? order? limit?

deletefrom
  = FROM table
  / word __ deletefrom

select
  = SELECT selectcols from? union?

union
  = UNION __ select
  / UNION __ word __ select

selectcols
  = selectcol ("," selectcols)?
  / __ word selectcols

selectcol
  = star
  / _ COUNT _ "(" (star / ex) ")" as?
  / _ COUNT _ "(" _ word (star / ex) ")" as?
  / ex as?

from
  = FROM tables where? group? having? order? limit?

as
  = AS? id

where
  = WHERE ex

group
  = GROUP_BY ordercols

having
  = HAVING ex

order
  = ORDER_BY ordercols

ordercols
  = ordercol ("," ordercols)?

ordercol
  = ex (ASC / DESC)?

limit
  = LIMIT (int / _ ALL _) (("," / OFFSET) int)?

tables
  = (table / _ "(" _ select ")" _) as? ("," tables)? join?

join
  = (JOIN / STRAIGHT_JOIN) tables (ON ex / USING parens)?
  / word __ join

table
  = db:id "." table:id
  / table:id

parens
  = _ "(" ex ("," ex)* ")" _

ex
  = ex1 operator ex
  / DEFAULT //! valid only in INSERT and UPDATE
  / ex1

ex1
  = _ string _
  / _ number _
  / _ (NULL / "\\N" / TRUE / FALSE / UNKNOWN) _
  / _ INTERVAL ex word _
  / _ (ALL / ANY / EXISTS)? _ "(" _ select ")" _
  / _ "@" ([a-z$_]i [a-z$_0-9]i* / idf) _
  / id? ROW? parens
  / column
  / _ (NOT / BINARY) ex1

operator "operator"
  = (!("/*" / "-- ") [^a-z$_0-9 \r\n\t#'"`();]i)+
  / AND / OR / XOR / DIV / MOD / IS / COLLATE / ESCAPE
  / (NOT __)? (IN / BETWEEN / (SOUNDS __)? LIKE / RLIKE / REGEXP)

star
  = (table ".")? _ "*" _

columns
  = column ("," column)*

column
  = table:id "." column:id
  / column:id

id
  = _ id:word _ { return id; }
  / _ id:idf _ { return id; }

idf
  = "`" idf:$([^`] / "``")* "`" { return idf.replace(/``/, '`'); }
  / &{ return (config.quotes == 'idf'); } '"' idf:$([^"] / '""')* '"' { return idf.replace(/""/, '"'); }

word
  = !keyword word:$([a-z$_]i [a-z$_0-9]i*) { return word; }

string
  = "'" string:$([^'] / "''")* "'" (__ string)? { return string.replace(/''/, "'"); }
  / &{ return (config.quotes == 'string'); } '"' string:$([^"] / '""')* '"' (__ string)? { return string.replace(/''/, "'"); }
  / word _ string

int
  = _ [0-9]+ _

number
  = [-+]? _ ([0-9]+ ("." [0-9]*)? / "." [0-9]+) ("e"i [+-]? [0-9]+)?
  / [-+]? _ "0x"i [0-9A-F]i+

wb
  = ![a-z$_0-9]i

_
  = space*

__
  = space+

space "space"
  = [ \r\n\t]
  / "-- " [^\n]*
  / "#" [^\n]*
  / "/*" (!"*/" .)* "*/"

keyword
  = FROM / STRAIGHT_JOIN / JOIN / WHERE / GROUP_BY / HAVING / ORDER_BY / LIMIT / UNION

SELECT = "SELECT"i wb
FROM = "FROM"i wb
JOIN = "JOIN"i wb
STRAIGHT_JOIN = "STRAIGHT_JOIN"i wb
ON = "ON"i wb
USING = "USING"i wb
AS = "AS"i wb
WHERE = "WHERE"i wb
GROUP_BY = "GROUP"i __ "BY"i wb
HAVING = "HAVING"i wb
ORDER_BY = "ORDER"i __ "BY"i wb
ASC = "ASC"i wb
DESC = "DESC"i wb
LIMIT = "LIMIT"i wb
OFFSET = "OFFSET"i wb
UNION = "UNION"i wb

INSERT = "INSERT"i wb
REPLACE = "REPLACE"i wb
SET = "SET"i wb
VALUES = "VALUE"i "S"i? wb
DEFAULT = "DEFAULT"i wb
DEFAULT_VALUES = "DEFAULT"i __ "VALUES"i wb
ON_DUPLICATE_KEY_UPDATE = "ON"i __ "DUPLICATE"i __ "KEY"i __ "UPDATE"i wb
UPDATE = "UPDATE"i wb
DELETE = "DELETE"i wb

COUNT = "COUNT"i wb
NULL = "NULL"i wb
TRUE = "TRUE"i wb
FALSE = "FALSE"i wb
UNKNOWN = "UNKNOWN"i wb
AND = "AND"i wb
OR = "OR"i wb
XOR = "XOR"i wb
NOT = "NOT"i wb
DIV = "DIV"i wb
MOD = "MOD"i wb
IN = "IN"i wb
BETWEEN = "BETWEEN"i wb
BINARY = "BINARY"i wb
IS = "IS"i wb
COLLATE = "COLLATE"i wb
ESCAPE = "ESCAPE"i wb
LIKE = "LIKE"i wb
RLIKE = "RLIKE"i wb
SOUNDS = "SOUNDS"i wb
REGEXP = "REGEXP"i wb
INTERVAL = "INTERVAL"i wb

ALL = "ALL"i wb
ANY = "ANY"i wb
EXISTS = "EXISTS"i wb
ROW = "ROW"i wb
