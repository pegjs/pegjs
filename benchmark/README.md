PEG.js Benchmark Suite
======================

This is the PEG.js benchmark suite. It measures speed of the parsers generated
by PEG.js on various inputs. Its main goal is to provide data for code generator
optimizations.

Running in Node.js
------------------

All commands in the following steps need to be executed in PEG.js root directory
(one level up from this one).

  1. Install all PEG.js dependencies, including development ones:

        $ npm install

  2. Execute the benchmark suite:

        $ make spec

  3. Wait for results.

Running in the Browser
----------------------

All commands in the following steps need to be executed in PEG.js root directory
(one level up from this one).

  1. Make sure you have Node.js and Python installed.

  2. Install all PEG.js dependencies, including development ones:

        $ npm install

  3. Build browser version of PEG.js:

        $ make browser

  4. Serve PEG.js root directory using a web server:

        $ python -m SimpleHTTPServer

  5. Point your browser to the [benchmark suite](http://localhost:8000/benchmark/index.html).

  6. Click the **Run** button and wait for results.
