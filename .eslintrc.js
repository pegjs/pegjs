"use strict";

module.exports = {

    "extends": "@futagoza",

    "rules": {

        "no-duplicate-imports": [ "error", { "includeExports": false } ],
        "no-eval": 0,

    },

    "overrides": [ {

        "files": [ "*.spec.js", "*.test.js" ],
        "extends": "@futagoza/dev/test",
        "rules": {

            "func-names": 0,
            "no-mixed-operators": 0,

        },

    } ],

    "root": true,

};
