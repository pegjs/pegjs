"use strict";

module.exports = {
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
