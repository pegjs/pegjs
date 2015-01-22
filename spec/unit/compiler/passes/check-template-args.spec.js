describe("compiler pass |checkTemplateArgs|", function() {
  var pass = PEG.compiler.passes.check.checkTemplateArgs;

  it("reports insufficient count of arguments", function() {
    expect(pass).toReportError([
      'start = List<".">',
      'List<E, D> = E (D E)*'
    ].join('\n'), {
      message: 'Insufficient count of template arguments for rule "List". Expected 2, found 1'
    });
    expect(pass).toReportError([
      'start = List<".", ., start>',
      'List<E, D> = E (D E)*'
    ].join('\n'), {
      message: 'Insufficient count of template arguments for rule "List". Expected 2, found 3'
    });
    expect(pass).not.toReportError([
      'start = List<".", .>',
      'List<E, D> = E (D E)*'
    ].join('\n'));
  });

  it("not allow template arguments for template parameters", function() {
    expect(pass).toReportError('Apply<E> = E<.>', {
      message: 'Template paramater "E" of rule "Apply" can\'t accept template arguments'
    });
    expect(pass).toReportError('Apply<E, D> = E<D>', {
      message: 'Template paramater "E" of rule "Apply" can\'t accept template arguments'
    });
  });
});
