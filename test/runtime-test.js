(function() {

/* ===== PEG.ArrayUtils ===== */

module("PEG.ArrayUtils");

test("each", function() {
  var sum;
  function increment(x) { sum += x; }

  sum = 0;
  PEG.ArrayUtils.each([], increment);
  strictEqual(sum, 0);

  sum = 0;
  PEG.ArrayUtils.each([1, 2, 3], increment);
  strictEqual(sum, 6);
});

test("map", function() {
  function square(x) { return x * x; }

  deepEqual(PEG.ArrayUtils.map([], square), []);
  deepEqual(PEG.ArrayUtils.map([1, 2, 3], square), [1, 4, 9]);
});

/* ===== PEG.StringUtils ===== */

module("PEG.StringUtils");

test("quote", function() {
  strictEqual(PEG.StringUtils.quote(""), '""');
  strictEqual(PEG.StringUtils.quote("abcd"), '"abcd"');
  strictEqual(
    PEG.StringUtils.quote("\"\\\r\u2028\u2029\n\"\\\r\u2028\u2029\n"),
    '"\\\"\\\\\\r\\u2028\\u2029\\n\\\"\\\\\\r\\u2028\\u2029\\n"'
  );
});

/* ===== PEG.RegExpUtils ===== */

module("PEG.RegExpUtils");

test("quoteForClass", function() {
  strictEqual(PEG.RegExpUtils.quoteForClass(""), '');
  strictEqual(PEG.RegExpUtils.quoteForClass("abcd"), 'abcd');
  strictEqual(
    PEG.RegExpUtils.quoteForClass("\\/]-\r\u2028\u2029\n\\/]-\r\u2028\u2029\n"),
    '\\\\\\/\\]\\-\\r\\u2028\\u2029\\n\\\\\\/\\]\\-\\r\\u2028\\u2029\\n'
  );
});

})();
