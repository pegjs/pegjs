describe("compiler pass |removeProxyRules|", function() {
  var pass = PEG.compiler.passes.transform.removeProxyRules;

  function proxyGrammar(rule) {
    return [rule, 'proxy = proxied', 'proxied = "a"'].join("\n");
  }

  function expressionDetails(details) {
    return {
      rules: [
        { type: "rule", name: "start", expression: details },
        { type: "rule", name: "proxied" }
      ]
    };
  }

  var defaultOptions    = { allowedStartRules: ["start"] },
      proxiedRefDetails = { type: "rule_ref", name: "proxied" },
      simpleDetails     = expressionDetails({ expression: proxiedRefDetails });

  it("removes proxy rule from a rule", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy'), defaultOptions, {
      rules: [
        { type: "rule", name: "start", expression: proxiedRefDetails },
        { type: "rule", name: "proxied" }
      ]
    });
  });

  it("removes proxy rule from a named", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start "start" = proxy'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a choice", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy / "a" / "b"'),
      defaultOptions,
      expressionDetails({ alternatives: [proxiedRefDetails, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" / "b" / proxy'),
      defaultOptions,
      expressionDetails({ alternatives: [{}, {}, proxiedRefDetails] })
    );
  });

  it("removes proxy rule from an action", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy { }'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a sequence", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy "a" "b"'),
      defaultOptions,
      expressionDetails({ elements: [proxiedRefDetails, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" "b" proxy'),
      defaultOptions,
      expressionDetails({ elements: [{}, {}, proxiedRefDetails] })
    );
  });

  it("removes proxy rule from a labeled", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = label:proxy'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a text", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = $proxy'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a simple and", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = &proxy'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a simple not", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = &proxy'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from an optional", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy?'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a zero or more", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy*'),
      defaultOptions,
      simpleDetails
    );
  });

  it("removes proxy rule from a one or more", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy+'),
      defaultOptions,
      simpleDetails
    );
  });

  it("doesn't remove a proxy rule listed in |allowedStartRules|", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy'),
      { allowedStartRules: ["proxy"] },
      {
        rules: [
          { name: "proxy"   },
          { name: "proxied" }
        ]
      }
    );
  });
});
