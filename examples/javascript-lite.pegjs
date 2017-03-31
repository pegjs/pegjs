// JavaScript "Lite" Grammar// =========================//// Based on grammar from ECMA-262, 5.1 Edition [1] but with many rules removed
// to represent a lighter weight, but mostly compatible language. Generated parser
// builds a syntax tree compatible with the ESTree spec [2].//
// Difference from JavaScript grammar in examples/javascript.pegjs:
//
//   * Removed all Unicode references to simplify the grammar.
//
//   * Removed automatic semicolon insertion. Everyone uses semicolons. Simplifies
//     the language and also eliminates dangling curly brace issues.
//
//   * Removed break, continue, debugger, delete, do, instanceof, in, void, while
//     and with rules. Functionality can be implemented with functions. Using
//     forEach(), map(), etc. also fix closure variable capturing.
//
//   * Removed regular expression rules. Use a string instead of special syntax.
//
//   * Removed literal array elision such as [1,,3]. I've never used it.
//
//   * Removed literal object set and get syntax. Complicates the language, and
//     you can use Object.defineProperty() to create setters and getters.
//
//   * Removed prefix and postfix operators ++ and --. Modern languages don't need
//     these. You can use i += 1, or iterator.moveNext() instead of ++iterator.
//
//   * Removed binary operators &, |, ^, ~ and <<. These can be implemented as
//     functions or abstracted to a higher level (BitSet, etc.) Greatly simplifies
//     the PEG operator precedence tree.
//
//   * Removed === and !== operators. A transpiler would convert all == to ===.
//
//   * Removed +=, -=, *=, /=, %= operators. Handy, but complicate the language.
//     Maybe I'll add them back if they're sorely missed.
//
//   * Removed comma sequence expressions (x = a, b). Quirk leftover from C,
//     not needed since for () is gone, and gets in the way of literal tuples.
//
//   * Removed empty ";" statements and labeled statements. Not needed nowadays.
//// Limitations:////   * Non-BMP characters are completely ignored to avoid surrogate pair//     handling.////   * One can create identifiers containing illegal characters using Unicode//     escape sequences. For example, "abcd\u0020efgh" is not a valid//     identifier, but it is accepted by the parser.////   * Strict mode is not recognized. This means that within strict mode code,//     "implements", "interface", "let", "package", "private", "protected",//     "public", "static" and "yield" can be used as names. Many other//     restrictions and exceptions from Annex C are also not applied.//// All the limitations could be resolved, but the costs would likely outweigh// the benefits.//// Many thanks to inimino [3] for his grammar [4] which helped me to solve some// problems (such as automatic semicolon insertion) and also served to double// check that I converted the original grammar correctly.//// [1] http://www.ecma-international.org/publications/standards/Ecma-262.htm// [2] https://github.com/estree/estree// [3] http://inimino.org/~inimino/blog/// [4] http://boshi.inimino.org/3box/asof/1270029991384/PEG/ECMAScript_unified.peg

{
  var TYPES_TO_PROPERTY_NAMES = {
    CallExpression:   "callee",
    MemberExpression: "object",
  };

  function filledArray(count, value) {
    return Array.apply(null, new Array(count))
      .map(function() { return value; });
  }

  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }

  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function buildBinaryExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "BinaryExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function buildLogicalExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "LogicalExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }

  function optionalList(value) {
    return value !== null ? value : [];
  }
}

Start
  = __ program:Program __ { return program; }

// ----- A.1 Lexical Grammar -----

SourceCharacter
  = .

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "

LineTerminator
  = [\n\r]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*

Identifier
  = !ReservedWord name:IdentifierName { return name; }

IdentifierName "identifier"
  = head:IdentifierStart tail:IdentifierPart* {
      return {
        type: "Identifier",
        name: head + tail.join("")
      };
    }

IdentifierStart
  = [A-Za-z]
  / "$"
  / "_"

IdentifierPart
  = IdentifierStart
  / [0-9]

ReservedWord
  = Keyword
  / FutureReservedWord
  / NullLiteral
  / BooleanLiteral

Keyword
  = CaseToken
  / CatchToken
  / DefaultToken
  / ElseToken
  / FinallyToken
  / FunctionToken
  / IfToken
  / NewToken
  / ReturnToken
  / SwitchToken
  / ThisToken
  / ThrowToken
  / TryToken
  / TypeofToken
  / VarToken

FutureReservedWord
  = ClassToken
  / ConstToken
  / EnumToken
  / ExportToken
  / ExtendsToken
  / ImportToken
  / SuperToken

Literal
  = NullLiteral
  / BooleanLiteral
  / NumericLiteral
  / StringLiteral

NullLiteral
  = NullToken { return { type: "Literal", value: null }; }

BooleanLiteral
  = TrueToken  { return { type: "Literal", value: true  }; }
  / FalseToken { return { type: "Literal", value: false }; }

// The "!(IdentifierStart / DecimalDigit)" predicate is not part of the official
// grammar, it comes from text in section 7.8.3.
NumericLiteral "number"
  = literal:HexIntegerLiteral !(IdentifierStart / DecimalDigit) {
      return literal;
    }
  / literal:DecimalLiteral !(IdentifierStart / DecimalDigit) {
      return literal;
    }

DecimalLiteral
  = DecimalIntegerLiteral "." DecimalDigit* ExponentPart? {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / "." DecimalDigit+ ExponentPart? {
      return { type: "Literal", value: parseFloat(text()) };
    }
  / DecimalIntegerLiteral ExponentPart? {
      return { type: "Literal", value: parseFloat(text()) };
    }

DecimalIntegerLiteral
  = "0"
  / NonZeroDigit DecimalDigit*

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

ExponentPart
  = ExponentIndicator SignedInteger

ExponentIndicator
  = "e"i

SignedInteger
  = [+-]? DecimalDigit+

HexIntegerLiteral
  = "0x"i digits:$HexDigit+ {
      return { type: "Literal", value: parseInt(digits, 16) };
     }

HexDigit
  = [0-9a-f]i

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "Literal", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "Literal", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" LineTerminatorSequence { return ""; }

EscapeSequence
  = CharacterEscapeSequence
  / "0" !DecimalDigit { return "\0"; }
  / HexEscapeSequence
  / UnicodeEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b"; }
  / "f"  { return "\f"; }
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }
  / "v"  { return "\v"; }

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) SourceCharacter { return text(); }

EscapeCharacter
  = SingleEscapeCharacter
  / DecimalDigit
  / "x"
  / "u"

HexEscapeSequence
  = "x" digits:$(HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

UnicodeEscapeSequence
  = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
      return String.fromCharCode(parseInt(digits, 16));
    }

// Tokens

CaseToken       = "case"       !IdentifierPart
CatchToken      = "catch"      !IdentifierPart
ClassToken      = "class"      !IdentifierPart
ConstToken      = "const"      !IdentifierPart
DefaultToken    = "default"    !IdentifierPart
ElseToken       = "else"       !IdentifierPart
EnumToken       = "enum"       !IdentifierPart
ExportToken     = "export"     !IdentifierPart
ExtendsToken    = "extends"    !IdentifierPart
FalseToken      = "false"      !IdentifierPart
FinallyToken    = "finally"    !IdentifierPart
FunctionToken   = "function"   !IdentifierPart
IfToken         = "if"         !IdentifierPart
ImportToken     = "import"     !IdentifierPart
NewToken        = "new"        !IdentifierPart
NullToken       = "null"       !IdentifierPart
ReturnToken     = "return"     !IdentifierPart
SuperToken      = "super"      !IdentifierPart
SwitchToken     = "switch"     !IdentifierPart
ThisToken       = "this"       !IdentifierPart
ThrowToken      = "throw"      !IdentifierPart
TrueToken       = "true"       !IdentifierPart
TryToken        = "try"        !IdentifierPart
TypeofToken     = "typeof"     !IdentifierPart
VarToken        = "var"        !IdentifierPart

// Skipped

__
  = (WhiteSpace / LineTerminatorSequence / Comment)*

// Automatic Semicolon Insertion

EOS
  = __ ";"

// ----- A.2 Number Conversions -----

// Irrelevant.

// ----- A.3 Expressions -----

PrimaryExpression
  = ThisToken { return { type: "ThisExpression" }; }
  / Identifier
  / Literal
  / ArrayLiteral
  / ObjectLiteral
  / "(" __ expression:Expression __ ")" { return expression; }

ArrayLiteral
  = "[" __ "]" {
      return {
        type: "ArrayExpression",
        elements: []
      };
    }
  / "[" __ elements:ElementList __ "]" {
      return {
        type: "ArrayExpression",
        elements: elements
      };
    }

ElementList
  = head:AssignmentExpression tail:(__ "," __ element:AssignmentExpression)*
    { return Array.prototype.concat.apply(head, tail); }

ObjectLiteral
  = "{" __ "}" { return { type: "ObjectExpression", properties: [] }; }
  / "{" __ properties:PropertyNameAndValueList __ ","? __ "}" {
       return { type: "ObjectExpression", properties: properties };
     }

PropertyNameAndValueList
  = head:PropertyAssignment tail:(__ "," __ PropertyAssignment)* {
      return buildList(head, tail, 3);
    }

PropertyAssignment
  = key:PropertyName __ ":" __ value:AssignmentExpression {
      return { type: "Property", key: key, value: value, kind: "init" };
    }

PropertyName
  = IdentifierName
  / StringLiteral
  / NumericLiteral

MemberExpression
  = head:(
        PrimaryExpression
      / FunctionExpression
      / NewToken __ callee:MemberExpression __ args:Arguments {
          return { type: "NewExpression", callee: callee, arguments: args };
        }
    )
    tail:(
        __ "[" __ property:Expression __ "]" {
          return { property: property, computed: true };
        }
      / __ "." __ property:IdentifierName {
          return { property: property, computed: false };
        }
    )*
    {
      return tail.reduce(function(result, element) {
        return {
          type: "MemberExpression",
          object: result,
          property: element.property,
          computed: element.computed
        };
      }, head);
    }

NewExpression
  = MemberExpression
  / NewToken __ callee:NewExpression {
      return { type: "NewExpression", callee: callee, arguments: [] };
    }

CallExpression
  = head:(
      callee:MemberExpression __ args:Arguments {
        return { type: "CallExpression", callee: callee, arguments: args };
      }
    )
    tail:(
        __ args:Arguments {
          return { type: "CallExpression", arguments: args };
        }
      / __ "[" __ property:Expression __ "]" {
          return {
            type: "MemberExpression",
            property: property,
            computed: true
          };
        }
      / __ "." __ property:IdentifierName {
          return {
            type: "MemberExpression",
            property: property,
            computed: false
          };
        }
    )*
    {
      return tail.reduce(function(result, element) {
        element[TYPES_TO_PROPERTY_NAMES[element.type]] = result;

        return element;
      }, head);
    }

Arguments
  = "(" __ args:(ArgumentList __)? ")" {
      return optionalList(extractOptional(args, 0));
    }

ArgumentList
  = head:AssignmentExpression tail:(__ "," __ AssignmentExpression)* {
      return buildList(head, tail, 3);
    }

LeftHandSideExpression
  = CallExpression
  / NewExpression

UnaryExpression
  = LeftHandSideExpression
  / operator:UnaryOperator __ argument:UnaryExpression {
      return {
        type: "UnaryExpression",
        operator: operator,
        argument: argument,
        prefix: true
      };
    }

UnaryOperator
  = "+"
  / "-"
  / "!"

MultiplicativeExpression
  = head:UnaryExpression tail:(__ MultiplicativeOperator __ UnaryExpression)* {
      return buildBinaryExpression(head, tail);
    }

MultiplicativeOperator
  = "*"
  / "/"
  / "%"

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)*
    { return buildBinaryExpression(head, tail); }

AdditiveOperator
  = "+"
  / "-"

RelationalExpression
  = head:AdditiveExpression tail:(__ RelationalOperator __ AdditiveExpression)* {
      return buildBinaryExpression(head, tail);
    }

RelationalOperator
  = "<="
  / ">="
  / "<"
  / ">"

EqualityExpression
  = head:RelationalExpression tail:(__ EqualityOperator __ RelationalExpression)* {
      return buildBinaryExpression(head, tail);
    }

EqualityOperator
  = "=="
  / "!="

LogicalANDExpression
  = head:EqualityExpression tail:(__ LogicalANDOperator __ EqualityExpression)* {
      return buildLogicalExpression(head, tail);
    }

LogicalANDOperator
  = "&&"

LogicalORExpression
  = head:LogicalANDExpression tail:(__ LogicalOROperator __ LogicalANDExpression)* {
      return buildLogicalExpression(head, tail);
    }

LogicalOROperator
  = "||"

ConditionalExpression
  = test:LogicalORExpression __ "?" __ consequent:AssignmentExpression __ ":" __ alternate:AssignmentExpression {
      return {
        type: "ConditionalExpression",
        test: test,
        consequent: consequent,
        alternate: alternate
      };
    }
  / LogicalORExpression

AssignmentExpression
  = left:LeftHandSideExpression __ "=" !"=" __ right:AssignmentExpression {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: left,
        right: right
      };
    }
  / ConditionalExpression

Expression
  = head:AssignmentExpression {
      return head;
    }

// ----- A.4 Statements -----

Statement
  = Block
  / VariableStatement
  / ExpressionStatement
  / IfStatement
  / ReturnStatement
  / SwitchStatement
  / ThrowStatement
  / TryStatement

Block
  = "{" __ body:(StatementList __)? "}" {
      return {
        type: "BlockStatement",
        body: optionalList(extractOptional(body, 0))
      };
    }

StatementList
  = head:Statement tail:(__ Statement)* {
      return buildList(head, tail, 1);
    }

VariableStatement
  = VarToken __ declarations:VariableDeclarationList EOS {
      return {
        type: "VariableDeclaration",
        declarations: declarations,
        kind: "var"
      };
    }

VariableDeclarationList
  = head:VariableDeclaration tail:(__ "," __ VariableDeclaration)* {
      return buildList(head, tail, 3);
    }

VariableDeclaration
  = id:Identifier init:(__ Initialiser)? {
      return {
        type: "VariableDeclarator",
        id: id,
        init: extractOptional(init, 1)
      };
    }

Initialiser
  = "=" !"=" __ expression:AssignmentExpression { return expression; }

ExpressionStatement
  = !("{" / FunctionToken) expression:Expression EOS {
      return {
        type: "ExpressionStatement",
        expression: expression
      };
    }

IfStatement
  = IfToken __ "(" __ test:Expression __ ")" __ consequent:Statement __ ElseToken __ alternate:Statement {
      return {
        type: "IfStatement",
        test: test,
        consequent: consequent,
        alternate: alternate
      };
    }
  / IfToken __ "(" __ test:Expression __ ")" __ consequent:Statement {
      return {
        type: "IfStatement",
        test: test,
        consequent: consequent,
        alternate: null
      };
    }

ReturnStatement
  = ReturnToken EOS {
      return { type: "ReturnStatement", argument: null };
    }
  / ReturnToken __ argument:Expression EOS {
      return { type: "ReturnStatement", argument: argument };
    }

SwitchStatement
  = SwitchToken __ "(" __ discriminant:Expression __ ")" __
    cases:CaseBlock
    {
      return {
        type: "SwitchStatement",
        discriminant: discriminant,
        cases: cases
      };
    }

CaseBlock
  = "{" __ clauses:(CaseClauses __)? "}" {
      return optionalList(extractOptional(clauses, 0));
    }
  / "{" __
    before:(CaseClauses __)?
    default_:DefaultClause __
    after:(CaseClauses __)? "}"
    {
      return optionalList(extractOptional(before, 0))
        .concat(default_)
        .concat(optionalList(extractOptional(after, 0)));
    }

CaseClauses
  = head:CaseClause tail:(__ CaseClause)* { return buildList(head, tail, 1); }

CaseClause
  = CaseToken __ test:Expression __ ":" consequent:(__ StatementList)? {
      return {
        type: "SwitchCase",
        test: test,
        consequent: optionalList(extractOptional(consequent, 1))
      };
    }

DefaultClause  = DefaultToken __ ":" consequent:(__ StatementList)? {      return {        type: "SwitchCase",        test: null,        consequent: optionalList(extractOptional(consequent, 1))      };    }

ThrowStatement  = ThrowToken __ argument:Expression EOS {      return { type: "ThrowStatement", argument: argument };    }TryStatement  = TryToken __ block:Block __ handler:Catch __ finalizer:Finally {      return {        type: "TryStatement",        block: block,        handler: handler,        finalizer: finalizer      };    }  / TryToken __ block:Block __ handler:Catch {      return {        type: "TryStatement",        block: block,        handler: handler,        finalizer: null      };    }  / TryToken __ block:Block __ finalizer:Finally {      return {        type: "TryStatement",        block: block,        handler: null,        finalizer: finalizer      };    }Catch  = CatchToken __ "(" __ param:Identifier __ ")" __ body:Block {      return {        type: "CatchClause",        param: param,        body: body      };    }Finally  = FinallyToken __ block:Block { return block; }

// ----- A.5 Functions and Programs -----

FunctionDeclaration
  = FunctionToken __ id:Identifier __
    "(" __ params:(FormalParameterList __)? ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "FunctionDeclaration",
        id: id,
        params: optionalList(extractOptional(params, 0)),
        body: body
      };
    }

FunctionExpression
  = FunctionToken __ id:(Identifier __)?
    "(" __ params:(FormalParameterList __)? ")" __
    "{" __ body:FunctionBody __ "}"
    {
      return {
        type: "FunctionExpression",
        id: extractOptional(id, 0),
        params: optionalList(extractOptional(params, 0)),
        body: body
      };
    }

FormalParameterList
  = head:Identifier tail:(__ "," __ Identifier)* {
      return buildList(head, tail, 3);
    }

FunctionBody
  = body:SourceElements? {
      return {
        type: "BlockStatement",
        body: optionalList(body)
      };
    }

Program
  = body:SourceElements? {
      return {
        type: "Program",
        body: optionalList(body)
      };
    }

SourceElements
  = head:SourceElement tail:(__ SourceElement)* {
      return buildList(head, tail, 1);
    }

SourceElement
  = Statement
  / FunctionDeclaration

// ----- A.6 Universal Resource Identifier Character Classes -----// Irrelevant.// ----- A.7 Regular Expressions -----// Irrelevant.// ----- A.8 JSON -----// Irrelevant.

