# Contribution Guidelines

The best way to contribute to PEG.js is by using it and giving back useful
feedback, reporting discovered bugs or requesting missing features.

You can also contribute code, but be advised that many patches end up being
rejected, usually because the change doesn’t fit the project or because of
various implementation issues. In almost all cases it’s best to get in touch
first before sending a patch.

## Reporting Bugs

Report bugs using [GitHub issues][issues]. Before submitting a bug report,
please [search existing reports][issues-search-bugs] to see if the bug wasn’t
reported already.

In the report, please describe:

  * Steps to reproduce the problem
  * Expected result(s)
  * Actual result(s)

In most cases, it’s also useful to include a **minimal** example (grammar +
input) reproducing the problem.

## Requesting Features

Request features using [GitHub issues][issues]. Before submitting a feature
request, please [search existing requests][issues-search-enhancements] to see
if the feature wasn’t requested already.

In the request, please describe:

  * How the feature should work
  * Use case(s) behind it

## Contributing Code

Contribute code using [GitHub pull requests][pulls]. For non-trivial changes,
first file a corresponding bug report or feature request. This will ensure the
*problem* is separated from a *solution*.

Split your change into atomic commits with descriptive messages adhering to
[these conventions][git-commit-messages]. Have a look in the commit history to
see good examples.

When appropriate, add documentation and tests.

Before submitting, make sure your change passes the tests (`yarn test`) and
ESLint checks (`yarn lint`).

[issues]: https://github.com/pegjs/pegjs/issues
[issues-search-bugs]: https://github.com/pegjs/pegjs/issues?q=is%3Aopen+is%3Aissue+label%3ABug
[issues-search-enhancements]: https://github.com/pegjs/pegjs/issues?q=is%3Aopen+is%3Aissue+label%3AEnhancement
[pulls]: https://github.com/pegjs/pegjs/pulls
[git-commit-messages]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
