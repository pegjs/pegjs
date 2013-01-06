describe("compiler pass |removeProxyRules|", function() {
  var pass = PEG.compiler.passes.removeProxyRules;

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

  var proxiedRefDetails = { type: "rule_ref", name: "proxied" },
      simpleDetails     = expressionDetails({ expression: proxiedRefDetails });

  it("removes proxy rule from a rule", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy'), {
      rules: [
        { type: "rule", name: "start", expression: proxiedRefDetails },
        { type: "rule", name: "proxied" }
      ]
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
      expressionDetails({ alternatives: [proxiedRefDetails, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" / "b" / proxy'),
      expressionDetails({ alternatives: [{}, {}, proxiedRefDetails] })
    );
  });

  it("removes proxy rule from an action", function() {
    expect(pass).toChangeAST(proxyGrammar('start = proxy { }'), simpleDetails);
  });

  it("removes proxy rule from a sequence", function() {
    expect(pass).toChangeAST(
      proxyGrammar('start = proxy "a" "b"'),
      expressionDetails({ elements: [proxiedRefDetails, {}, {}] })
    );
    expect(pass).toChangeAST(
      proxyGrammar('start = "a" "b" proxy'),
      expressionDetails({ elements: [{}, {}, proxiedRefDetails] })
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
