"use strict";

const vue = require( "eslint-plugin-vue/lib/configs/base" );

vue.files = [ "*.vue" ];

Object.assign( vue.rules, {

    ...require( "eslint-plugin-vue/lib/configs/essential" ).rules,
    ...require( "eslint-plugin-vue/lib/configs/strongly-recommended" ).rules,
    ...require( "eslint-plugin-vue/lib/configs/recommended" ).rules,

    "vue/html-indent": [ "error", 4 ],
    "vue/singleline-html-element-content-newline": 0,

} );

module.exports = vue;
