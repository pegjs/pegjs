Runner = {
  run: function(benchmarks, runCount, options, callbacks) {

    /* Queue */

    var Q = {
      functions: [],

      add: function(f) {
        this.functions.push(f);
      },

      run: function() {
        if (this.functions.length > 0) {
          this.functions.shift()();

          /*
           * We can't use |arguments.callee| here because |this| would get
           * messed-up in that case.
           */
          setTimeout(function() { Q.run(); }, 0);
        }
      }
    };

    /*
     * The benchmark itself is factored out into several functions (some of them
     * generated), which are enqueued and run one by one using |setTimeout|. We
     * do this for two reasons:
     *
     *   1. To avoid bowser mechanism for interrupting long-running scripts to
     *      kick-in (or at least to not kick-in that often).
     *
     *   2. To ensure progressive rendering of results in the browser (some
     *      browsers do not render at all when running JavaScript code).
     *
     * The enqueued functions share state, which is all stored in the properties
     * of the |state| object.
     */

    var state = {};

    function initialize() {
      callbacks.start();

      state.totalInputSize = 0;
      state.totalParseTime = 0;
    }

    function benchmarkInitializer(i) {
      return function() {
        callbacks.benchmarkStart(benchmarks[i]);

        state.parser = PEG.buildParser(
          callbacks.readFile("../examples/" + benchmarks[i].id + ".pegjs"),
          options
        );
        state.benchmarkInputSize = 0;
        state.benchmarkParseTime = 0;
      };
    }

    function testRunner(i, j) {
      return function() {
        var benchmark = benchmarks[i];
        var test = benchmark.tests[j];

        callbacks.testStart(benchmark, test);

        var input = callbacks.readFile(benchmark.id + "/" + test.file);

        var parseTime = 0;
        for (var k = 0; k < runCount; k++) {
          var t = (new Date()).getTime();
          state.parser.parse(input);
          parseTime += (new Date()).getTime() - t;
        }
        var averageParseTime = parseTime / runCount;

        callbacks.testFinish(benchmark, test, input.length, averageParseTime);

        state.benchmarkInputSize += input.length;
        state.benchmarkParseTime += averageParseTime;
      };
    }

    function benchmarkFinalizer(i) {
      return function() {
        callbacks.benchmarkFinish(
          benchmarks[i],
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

    /* Main */

    Q.add(initialize);
    for (var i = 0; i < benchmarks.length; i++) {
      Q.add(benchmarkInitializer(i));
      for (var j = 0; j < benchmarks[i].tests.length; j++) {
        Q.add(testRunner(i, j));
      }
      Q.add(benchmarkFinalizer(i));
    }
    Q.add(finalize);

    Q.run();
  }
};
