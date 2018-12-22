"use strict";

// const DEV_ENV = process.env.NODE_ENV !== "production";

module.exports = {

    title: "PEG.js",
    description: "A parser generator for JavaScript",
    head: [

        [ "meta", { "http-equiv": "XA-UA-Compatible", content: "IE=edge" } ],
        [ "link", { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" } ],

    ],
    dest: "dist",
    ga: "UA-100728112-1",
    serviceWorker: true,
    themeConfig: {

        nav: [
            {
                text: "Try Online",
                link: "/online",
            },
            {
                text: "Documentation",
                items: [
                    {
                        text: "Guides",
                        link: "/guides/getting-started",
                    },
                    {
                        text: "Grammar",
                        link: "/grammar/",
                    },
                    {
                        text: "API",
                        link: "/guides/javascript-api",
                    },
                    {
                        text: "Compatibility",
                        link: "/guides/compatibility",
                    },
                ],
            },
            {
                text: "Development",
                items: [
                    {
                        text: "Contribute",
                        link: "/development",
                    },
                    {
                        text: "Changelogs",
                        link: "/changelogs/",
                    },
                    {
                        text: "Source code",
                        link: "https://github.com/pegjs/pegjs",
                    },
                    {
                        text: "Issue tracker",
                        link: "https://github.com/pegjs/pegjs/issues",
                    },
                ],
            },
            {
                text: "Community",
                items: [
                    {
                        text: "Forums",
                        link: "https://gitq.com/pegjs/pegjs",
                    },
                    {
                        text: "Wiki",
                        link: "https://github.com/pegjs/pegjs/wiki",
                    },
                    {
                        text: "Stack Overflow",
                        link: "https://stackoverflow.com/questions/tagged/pegjs",
                    },
                    {
                        text: "Twitter",
                        link: "https://twitter.com/pegjs",
                    },
                    {
                        text: "Plugins",
                        link: "https://www.npmjs.com/search?q=pegjs%20plugin",
                    }
                ],
            },
        ],
        sidebar: {

            "/grammar/": [
                "",
                "parsing-expression-types",
                "balanced-braces",
                "action-execution-environment",
                "backtracking",
                "case-insensitivity",
                "error-messages",
                [ "tracer", "Tracer" ],
            ],

            "/guides/": [
                "getting-started",
                "installation",
                "command-line",
                "generating-a-parser",
                "javascript-api",
                "plugins",
                "using-the-parser",
                "compatibility",
            ],

            "/": false,

        },
        sidebarDepth: 0,
        displayAllHeaders: false,
        activeHeaderLinks: true,
        // search: DEV_ENV ? true : false,
        searchMaxSuggestions: 5,
        // algolia: DEV_ENV ? void 0 : {

        //    apiKey: "<API_KEY>",
        //    indexName: "<INDEX_NAME>"

        // },
        lastUpdated: true,
        serviceWorker: {

            updatePopup: true,

        },
        docsRepo: "pegjs/pegjs",
        docsDir: "docs",
        editLinks: true,
        evergreen: false,

    },

};
