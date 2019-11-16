"use strict";

const __hasOwnProperty = Object.prototype.hasOwnProperty;

// Checks that each rule is defined only once.
function reportDuplicateRules( ast, session ) {

    const rules = {};

    const check = session.buildVisitor( {
        rule( node ) {

            const name = node.name;

            if ( __hasOwnProperty.call( rules, name ) ) {

                const start = rules[ name ].start;

                session.error(
                    `Rule "${ name }" is already defined at line ${ start.line }, column ${ start.column }.`,
                    node.location,
                );

            }

            rules[ node.name ] = node.location;

        },
    } );

    check( ast );

}

module.exports = reportDuplicateRules;
