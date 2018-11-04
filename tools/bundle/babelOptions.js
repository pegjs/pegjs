"use strict";

// @babel/core
const babelOptions = {
    "comments": false,
    "compact": false,
    "presets": [
        [
            "@babel/preset-env",
            {
                "modules": false,
                "targets": {
                    "ie": 11
                }
            }
        ]
    ]
};

// rollup-plugin-babel
babelOptions.babelrc = false;
babelOptions.exclude = "node_modules/**";
babelOptions.runtimeHelpers = true;

module.exports = babelOptions;
