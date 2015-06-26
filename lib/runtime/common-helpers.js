// common-helpers.js
function text() {
  return input.substring(peg$savedPos, peg$currPos);
}

function location() {
  return peg$computeLocation(peg$savedPos, peg$currPos);
}

function expected(description) {
  throw peg$buildException(
    null,
    [{ type: "other", description: description }],
    input.substring(peg$savedPos, peg$currPos),
    peg$computeLocation(peg$savedPos, peg$currPos)
  );
}

function error(message) {
  throw peg$buildException(
    message,
    null,
    input.substring(peg$savedPos, peg$currPos),
    peg$computeLocation(peg$savedPos, peg$currPos)
  );
}

var peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
    peg$maxFailPos       = 0,
    peg$maxFailExpected  = [];

function peg$computePosDetails(pos) {
  var details = peg$posDetailsCache[pos],
      p, ch;

  if (details) {
    return details;
  } else {
    p = pos - 1;
    while (!peg$posDetailsCache[p]) {
      p--;
    }

    details = peg$posDetailsCache[p];
    details = {
      line:   details.line,
      column: details.column,
      seenCR: details.seenCR
    };

    while (p < pos) {
      ch = input.charAt(p);
      if (ch === "\n") {
        if (!details.seenCR) { details.line++; }
        details.column = 1;
        details.seenCR = false;
      } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
        details.line++;
        details.column = 1;
        details.seenCR = true;
      } else {
        details.column++;
        details.seenCR = false;
      }

      p++;
    }

    peg$posDetailsCache[pos] = details;
    return details;
  }
}

function peg$computeLocation(startPos, endPos) {
  var startPosDetails = peg$computePosDetails(startPos),
      endPosDetails   = peg$computePosDetails(endPos);

  return {
    start: {
      offset: startPos,
      line:   startPosDetails.line,
      column: startPosDetails.column
    },
    end: {
      offset: endPos,
      line:   endPosDetails.line,
      column: endPosDetails.column
    }
  };
}

function peg$fail(expected) {
  if (peg$currPos < peg$maxFailPos) { return; }

  if (peg$currPos > peg$maxFailPos) {
    peg$maxFailPos = peg$currPos;
    peg$maxFailExpected = [];
  }

  peg$maxFailExpected.push(expected);
}

function peg$buildException(message, expected, found, location) {
  function cleanupExpected(expected) {
    var i = 1;

    expected.sort(function(a, b) {
      if (a.description < b.description) {
        return -1;
      } else if (a.description > b.description) {
        return 1;
      } else {
        return 0;
      }
    });

    /*
     * This works because the bytecode generator guarantees that every
     * expectation object exists only once, so it's enough to use |===| instead
     * of deeper structural comparison.
     */
    while (i < expected.length) {
      if (expected[i - 1] === expected[i]) {
        expected.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  function buildMessage(expected, found) {
    function stringEscape(s) {
      function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

      /*
       * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
       * literal except for the closing quote character, backslash, carriage
       * return, line separator, paragraph separator, and line feed. Any character
       * may appear in the form of an escape sequence.
       *
       * For portability, we also escape all control and non-ASCII characters.
       * Note that "\0" and "\v" escape sequences are not used because JSHint does
       * not like the first and IE the second.
       */
      return s
        .replace(/\\/g,   '\\\\')       // backslash
        .replace(/"/g,    '\\"')        // closing double quote
        .replace(/\x08/g, '\\b')        // backspace
        .replace(/\t/g,   '\\t')        // horizontal tab
        .replace(/\n/g,   '\\n')        // line feed
        .replace(/\f/g,   '\\f')        // form feed
        .replace(/\r/g,   '\\r')        // carriage return
        .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
        .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
        .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
    }

    var expectedDescs = new Array(expected.length),
        expectedDesc, foundDesc, i;

    for (i = 0; i < expected.length; i++) {
      expectedDescs[i] = expected[i].description;
    }

    expectedDesc = expected.length > 1
      ? expectedDescs.slice(0, -1).join(", ")
          + " or "
          + expectedDescs[expected.length - 1]
      : expectedDescs[0];

    foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

    return "Expected " + expectedDesc + " but " + foundDesc + " found.";
  }

  if (expected !== null) {
    cleanupExpected(expected);
  }

  return new peg$SyntaxError(
    message !== null ? message : buildMessage(expected, found),
    expected,
    found,
    location
  );
}
