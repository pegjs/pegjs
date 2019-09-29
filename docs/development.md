---
title: Development
editLink: false
---

PEG.js is currently maintained by [Futago-za Ryuu](https://github.com/futagoza) ([@futagozaryuu](https://twitter.com/futagozaryuu)).

Since it's [inception](https://www.google.com/search?q=inception+meaning) in 2010, PEG.js was maintained by [David Majda](https://majda.cz/) ([@dmajda](http://twitter.com/dmajda)), until [May 2017](https://github.com/pegjs/pegjs/issues/503).

::: warning
The [Bower package](https://github.com/pegjs/bower) (which was maintained by [Michel Krämer](http://www.michel-kraemer.com/) ([@michelkraemer](https://twitter.com/michelkraemer))) has been deprecated, and will no longer be updated.
:::

## Contribute

You are welcome to contribute code using [GitHub pull requests](https://github.com/pegjs/pegjs/pulls). Unless your contribution is really trivial you should get in touch with me first (preferably by creating a new issue on the [issue tracker](https://github.com/pegjs/pegjs/issues)) - this can prevent wasted effort on both sides.

> Before submitting a pull request, please make sure you've checked out the [Contribution Guidelines](https://github.com/pegjs/pegjs/blob/master/.github/CONTRIBUTING.md).

_Ensure you have Node.js 8.6+ and Yarn installed._

1. Create a fork of [https://github.com/pegjs/pegjs](https://github.com/pegjs/pegjs)
2. Clone your fork, and optionally create a new branch
3. Run the command `yarn install` from the root of your clone
4. Add and commit your changes
5. Validate your changes:
    - Lint the JavaScript changes (command line only, run `yarn lint`)
    - Run tests to ensure nothing's broken: `yarn test` from the root of the repository
    - Run benchmarks to check performance: `yarn benchmark`
    - Check the impact of your commits: [see separate documentation](https://github.com/pegjs/pegjs/blob/master/tools/impact/README.md)
6. If validation fails: reverse your commit, fix the problem and then add/commit again
7. Push the commits from your clone to the fork
8. From your fork, start a new pull request

It's also a good idea to check out the [package.json](https://github.com/pegjs/pegjs/blob/master/package.json) that defines various scripts.

To see the list of contributors check out the [repository's contributors page](https://github.com/pegjs/pegjs/graphs/contributors).

<PageFooter />
