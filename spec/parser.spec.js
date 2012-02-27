describe("PEG.js grammar parser", function() {
  it("works", function() {
    expect(PEG.parser.parse('start = "a"')).toEqual({
      type:        "grammar",
      initializer: null,
      rules:       [
        {
          type:       "rule",
          name:       "start",
          displayName: null,
          expression:  { type: "literal", value: "a", ignoreCase: false }
        }
      ],
      startRule:   "start"
    });
  });
});
