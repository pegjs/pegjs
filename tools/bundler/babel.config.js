"use strict";

module.exports = {

    "comments": false,
    "compact": false,
    "presets": [
        [
            require.resolve( "@babel/preset-env" ),
            {
                "modules": false,
                "targets": {
                    "ie": 11
                }
            }
        ]
    ]

};
