# Contribution Guidelines

PEG.js is an open source project and it welcomes contributions. To make sure
your contributions are useful and the overall process is smooth, please adhere
to these guidelines.

You can contribute in three main ways: by reporting bugs, requesting features,
and contributing code.

## Reporting Bugs

You can report bugs using [GitHub issues][issues]. Before submitting a bug
report, [search the existing reports][issues-search-bugs] to see if the bug
wasn’t reported already.

Each bug report should contain this information:

  * Steps to reproduce
  * What you expected to happened
  * What happened instead

In most cases, it is useful to include a **minimal** example (grammar + input)
reproducing the problem.

## Requesting Features

You can request features using [GitHub issues][issues]. Before submitting a
feature request, [search the existing requests][issues-search-enhancements] to
see if the feature wasn’t requested already.

Each feature request should contain this information:

  * Feature description
  * Why do you request it

## Contributing Code

You can contribute code using [GitHub pull requests][pulls]. However, for
anything but trivial changes, file an issue first. Your idea may not fit the
project, or the implementation you have in mind may not be the right one. Filing
an issue in these cases will prevent wasting time and effort on both sides.

Split your change into atomic commits with descriptive commit messages adhering
to [these conventions][git-commit-messages]. Have a look in the commit history
to see good examples.

When appropriate, add documentation and tests.

Before submitting, make sure your change passes the specs (`make spec`) and
ESLint checks (`make lint`).

[issues]: https://github.com/pegjs/pegjs/issues
[issues-search-bugs]: https://github.com/pegjs/pegjs/issues?q=is%3Aopen+is%3Aissue+label%3ABug
[issues-search-enhancements]: https://github.com/pegjs/pegjs/issues?q=is%3Aopen+is%3Aissue+label%3AEnhancement
[pulls]: https://github.com/pegjs/pegjs/pulls
[git-commit-messages]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
