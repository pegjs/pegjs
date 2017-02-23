PEG.js Test Suite
=================

This is the PEG.js test suite. It ensures PEG.js works correctly. All tests
should always pass on all supported platforms.

Running in Node.js
------------------

All commands in the following steps need to be executed in PEG.js root directory
(one level up from this one).

  1. Install all PEG.js dependencies, including development ones:

     ```console
     $ npm install
     ```

  2. Execute the test suite:

     ```console
     $ gulp test
     ```

  3. Watch the tests pass (or fail).

Running in the Browser
----------------------

All commands in the following steps need to be executed in PEG.js root directory
(one level up from this one).

  1. Make sure you have Node.js installed.

  2. Install all PEG.js dependencies, including development ones:

     ```console
     $ npm install
     ```

  3. Serve the test suite using a web server:

     ```console
     $ test/server
     ```

  4. Point your browser to the [test suite](http://localhost:8000/).

  5. Watch the tests pass (or fail).
