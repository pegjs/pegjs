"use strict";

module.exports = {

    input: "src/parser.pegjs",
    output: "packages/pegjs/lib/parser.js",

    header: "/* eslint-disable */",

    dependencies: {

        ast: "./ast",
        util: "./util"

    },

    features: {

        offset: false,
        range: false,
        expected: false,

    },

};
