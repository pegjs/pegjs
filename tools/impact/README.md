This directory contains a tool used on the PEG.js repository that measures the impact of two git commits on a number of generated parsers, extracting the benchmark speeds and generated parser sizes, comparing the results of each commit against the other before finally displaying the overall results in the console.

From the root of the repository:

```sh
npx impact <commit>
npx impact <commit_before> <commit_after>
```
