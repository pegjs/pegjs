"use strict";

const path = require( "path" );

const config = {
    ...require( "eslint-config-futagozaryuu/stylistic-issues" ).rules,
    ...require( "eslint-config-futagozaryuu/variables" ).rules,
    ...require( "eslint-config-futagozaryuu/es2015" ).rules,
};

function ts( cwd ) {

    const ts = require( "@typescript-eslint/eslint-plugin/dist/configs/base.json" );
    ts.files = [ "*.ts" ];
    ts.parserOptions = {

        "project": path.join( cwd, "tsconfig.json" ),
        "sourceType": "module",

    };
    ts.rules = {

        ...require( "@typescript-eslint/eslint-plugin/dist/configs/recommended.json" ).rules,
        ...require( "@typescript-eslint/eslint-plugin/dist/configs/eslint-recommended" ).default.overrides[ 0 ].rules,

        "strict": "off",
        "node/no-unsupported-features/es-syntax": "off",

        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/indent": config.indent,
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/member-delimiter-style": [ "error", {
            "multiline": {
                "delimiter": "semi",
                "requireLast": true,
            },
            "singleline": {
                "delimiter": "semi",
                "requireLast": true,
            },
        } ],
        "@typescript-eslint/member-naming": [ "warn", {
            "private": "^_",
        } ],
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/no-array-constructor": config[ "no-array-constructor" ],
        "@typescript-eslint/no-empty-interface": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-extraneous-class": [ "error", {
            "constructorOnly": true,
            "allowEmpty": false,
            "staticOnly": false,
        } ],
        "@typescript-eslint/no-for-in-array": "error",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-type-alias": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": config[ "no-use-before-define" ],
        "no-useless-constructor": "off",
        "@typescript-eslint/no-useless-constructor": config[ "no-useless-constructor" ],
        "@typescript-eslint/promise-function-async": "off",
        "@typescript-eslint/restrict-plus-operands": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/prefer-interface": "off",
        "@typescript-eslint/explicit-function-return-type": [ "error", {
            allowExpressions: true,
        } ],

    };

    return ts;

}

module.exports = ts;
