"use strict";

const { Bundler, expand } = require( "../../export.utils" );

const template = require( "../../templates/article" );

module.exports = Bundler.create( {

    script: __filename,
    check: expand( "test" ),
    config: {

        entry: expand( "test/browser.stub.js" ),
        library: [ "peg", "test" ],
        output: expand( "public/js/test-bundle.min.js" ),

    },

    next() {

        return template( {
            title: "Test",
            content: `

                <div id="mocha"></div>

                <link href="/css/test.css" rel="stylesheet" />

                <script>
                    if ( window.MSInputMethodContext && document.documentMode )

                        document.getElementById( "mocha" ).innerHTML = "Sorry, IE11 is not supported by the Spec Runner's dependencies.";

                    else

                        document.write( "<script src='/js/test-bundle.min.js'><\\/script>" );
                </script>

            `,
        } );

    },

} );
