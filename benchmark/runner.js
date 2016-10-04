"use strict";

/* global setTimeout */

let peg = require("../lib/peg");

let Runner = {
  run: function(benchmarks, runCount, options, callbacks) {

    // Queue

    let Q = {
      functions: [],

      add: function(f) {
        this.functions.push(f);
      },

      run: function() {
        if (this.functions.length > 0) {
          this.functions.shift()();

          // We can't use |arguments.callee| here because |this| would get
          // messed-up in that case.
          setTimeout(() => { Q.run(); }, 0);
        }
      }
    };

    // The benchmark itself is factored out into several functions (some of them
    // generated), which are enqueued and run one by one using |setTimeout|. We
    // do this for two reasons:
    //
    //   1. To avoid bowser mechanism for interrupting long-running scripts to
    //      kick-in (or at least to not kick-in that often).
    //
    //   2. To ensure progressive rendering of results in the browser (some
    //      browsers do not render at all when running JavaScript code).
    //
    // The enqueued functions share state, which is all stored in the properties
    // of the |state| object.

    let state = {};

    function initialize() {
      callbacks.start();

      state.totalInputSize = 0;
      state.totalParseTime = 0;
    }

    function benchmarkInitializer(benchmark) {
      return function() {
        callbacks.benchmarkStart(benchmark);

        state.parser = peg.generate(
          callbacks.readFile("../examples/" + benchmark.id + ".pegjs"),
          options
        );
        state.benchmarkInputSize = 0;
        state.benchmarkParseTime = 0;
      };
    }

    function testRunner(benchmark, test) {
      return function() {
        callbacks.testStart(benchmark, test);

        let input = callbacks.readFile(benchmark.id + "/" + test.file);

        let parseTime = 0;
        for (let i = 0; i < runCount; i++) {
          let t = (new Date()).getTime();
          state.parser.parse(input);
          parseTime += (new Date()).getTime() - t;
        }
        let averageParseTime = parseTime / runCount;

        callbacks.testFinish(benchmark, test, input.length, averageParseTime);

        state.benchmarkInputSize += input.length;
        state.benchmarkParseTime += averageParseTime;
      };
    }

    function benchmarkFinalizer(benchmark) {
      return function() {
        callbacks.benchmarkFinish(
          benchmark,
          state.benchmarkInputSize,
          state.benchmarkParseTime
        );

        state.totalInputSize += state.benchmarkInputSize;
        state.totalParseTime += state.benchmarkParseTime;
      };
    }

    function finalize() {
      callbacks.finish(state.totalInputSize, state.totalParseTime);
    }

    // Main

    Q.add(initialize);
    benchmarks.forEach(benchmark => {
      Q.add(benchmarkInitializer(benchmark));
      benchmark.tests.forEach(test => {
        Q.add(testRunner(benchmark, test));
      });
      Q.add(benchmarkFinalizer(benchmark));
    });
    Q.add(finalize);

    Q.run();
  }
};

module.exports = Runner;
