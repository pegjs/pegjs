describe("compiler pass |removeProxyRules|", function() {
  var pass = PEG.compiler.passes.removeProxyRules;

  function proxyGrammar(rule) {
    return [rule, 'proxy = proxied', 'proxied = "a"'].join("\n");
  }

  function expressionDetails(details) {
    return {
      rules: [
        { name: "start", expression: details },
        { name: "proxied" }
      ]
    };
  }

  var simpleDetails = expressionDetails({ expression: { name: "proxied" } });

  it("removes proxy rule from a rule", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy'), {
      startRule: "proxied",
      rules:     [{ name: "proxied", expression: { type: "literal" } }]
    });
  });

  it("removes proxy rule from a named", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start "start" = proxy'),
      simpleDetails
    );
  });

  it("removes proxy rule from a choice", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy / "a" / "b"'),
      expressionDetails({ alternatives: [{ name: "proxied" }, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" / "b" / proxy'),
      expressionDetails({ alternatives: [{}, {}, { name: "proxied" }] })
    );
  });

  it("removes proxy rule from an action", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy { }'), simpleDetails);
  });

  it("removes proxy rule from a sequence", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy "a" "b"'),
      expressionDetails({ elements: [{ name: "proxied" }, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" "b" proxy'),
      expressionDetails({ elements: [{}, {}, { name: "proxied" }] })
    );
  });

  it("removes proxy rule from a labeled", function() {
    expect(pass).toChangeAST(proxyGrammar('start = label:proxy'), simpleDetails);
  });

  it("removes proxy rule from a text", function() {
    expect(pass).toChangeAST(proxyGrammar('start = $proxy'), simpleDetails);
  });

  it("removes proxy rule from a simple and", function() {
    expect(pass).toChangeAST(proxyGrammar('start = &proxy'), simpleDetails);
  });

  it("removes proxy rule from a simple not", function() {
    expect(pass).toChangeAST(proxyGrammar('start = &proxy'), simpleDetails);
  });

  it("removes proxy rule from an optional", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy?'), simpleDetails);
  });

  it("removes proxy rule from a zero or more", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy*'), simpleDetails);
  });

  it("removes proxy rule from a one or more", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy+'), simpleDetails);
  });
});
