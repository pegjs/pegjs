describe("compiler pass |removeProxyRules|", function() {
  var pass = PEG.compiler.passes.transform.removeProxyRules;

  describe("when a proxy rule isn't listed in |allowedStartRules|", function() {
    it("updates references and removes it", function() {
      expect(pass).toChangeAST(
        [
          'start = proxy',
          'proxy = proxied',
          'proxied = "a"'
        ].join("\n"),
        { allowedStartRules: ["start"] },
        {
          rules: [
            {
              name:       "start",
              expression: { type: "rule_ref", name: "proxied" }
            },
            { name: "proxied" }
          ]
        }
      );
    });
  });

  describe("when a proxy rule is listed in |allowedStartRules|", function() {
    it("updates references but doesn't remove it", function() {
      expect(pass).toChangeAST(
        [
          'start = proxy',
          'proxy = proxied',
          'proxied = "a"'
        ].join("\n"),
        { allowedStartRules: ["start", "proxy"] },
        {
          rules: [
            {
              name:       "start",
              expression: { type: "rule_ref", name: "proxied" }
            },
            {
              name:       "proxy",
              expression: { type: "rule_ref", name: "proxied" }
            },
            { name: "proxied" }
          ]
        }
      );
    });
  });

  describe("when a proxy rule is reffered to imported rule", function() {
    it("do not update references and doesn't remove it", function() {
      expect(pass).not.toChangeAST(
        [
          'start = notProxy',
          'notProxy = #notProxied',
          'notProxied = "a"'
        ].join("\n"),
        { allowedStartRules: ["start"] }, 
        {
          rules: [
            {
              name:       "start",
              expression: { type: "rule_ref", name: "notProxy" }
            },
            {
              name:       "notProxy",
              expression: { type: "rule_ref", namespace: "notProxied", name: null }
            },
            { name: "notProxied" }
          ]
        }
      );
      expect(pass).not.toChangeAST(
        [
          'start = notProxy',
          'notProxy = #imported:notProxied',
          'notProxied = "a"'
        ].join("\n"),
        { allowedStartRules: ["start", "notProxy"] }, 
        {
          rules: [
            {
              name:       "start",
              expression: { type: "rule_ref", name: "notProxy" }
            },
            {
              name:       "notProxy",
              expression: { type: "rule_ref", namespace: "imported", name: "notProxied" }
            },
            { name: "notProxied" }
          ]
        }
      );
    });
  });
});
