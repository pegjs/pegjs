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

    themeConfig: {

        nav: require( "./config/nav.js" ),
        sidebar: require( "./config/sidebar.js" ),
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
        docsRepo: "pegjs/pegjs",
        docsDir: "docs",
        editLinks: true,
        evergreen: false,
        smoothScroll: true,

    },

    plugins: [
        [ '@vuepress/back-to-top', true ],
        [ '@vuepress/google-analytics', {
            ga: 'UA-100728112-1'
        } ],
    ],

    extraWatchFiles: [
        require.resolve( "./config/nav.js" ),
        require.resolve( "./config/sidebar.js" ),
    ],

};
