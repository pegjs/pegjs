"use strict";

const template = require( "./html" );

module.exports = ( { content, ga, layout, title } = {} ) => {

    content = `

        <div id="content">

            ${ content }

        </div>

    `;

    return template( { content, ga, layout, title } );

};
