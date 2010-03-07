(function() {

/* ===== PEG.ArrayUtils ===== */

module("PEG.ArrayUtils");

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

})();
