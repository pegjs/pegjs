PEG.js Spec Suite
=================

This is the PEG.js spec suite. It ensures PEG.js works correctly. All specs
should always pass on all supported platforms.

Running in Node.js
------------------

All commands in the following steps need to be executed in PEG.js root directory
(one level up from this one).

  1. Install all PEG.js dependencies, including development ones:

        $ npm install

  2. Execute the spec suite:

        $ make spec

  3. Watch the specs pass (or fail).

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

  5. Point your browser to the [spec suite](http://localhost:8000/spec/index.html).

  6. Watch the specs pass (or fail).
