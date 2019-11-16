"use strict";

const { fs, expand } = require( "../export.utils" );

const template = require( "./html" );

module.exports = async ( { ga, input, lib, layout, title } = {} ) => {

    const EDITOR_VIEW = await fs.readFile( expand( "editor.html", __dirname ), "utf8" );

    const content = `

        <div id="loader"> <div id="loader-inner">Loading...</div> </div>

        <div id="content">

            ${ EDITOR_VIEW.replace( "$$DEFAULT_INPUT", input ) }

        </div>

        <script src="https://unpkg.com/jquery@1.12.4/dist/jquery.min.js"></script>
        <script src="https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js"></script>
        <script src="${ lib }"></script>
        <script src="/vendor/jsdump/jsDump.js"></script>
        <script src="/vendor/codemirror/codemirror.js"></script>
        <script src="/js/online.js"></script>

    `;

    return template( {
        bodyStart: "",
        bodyEnd: "",
        content,
        ga,
        head: `<link rel="stylesheet" href="/vendor/codemirror/codemirror.css">`,
        layout: layout || "online",
        title,
    } );

};
