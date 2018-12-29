"use strict";

module.exports = {

    "extends": "plugin:vue/recommended",

    "parserOptions": {

        // plugin:vue/recommended set's this to "module" for some reason...
        "sourceType": "script"

    },

    "rules": {

        "vue/html-indent": [ "error", 4 ],
        "vue/singleline-html-element-content-newline": 0,

    },

};
