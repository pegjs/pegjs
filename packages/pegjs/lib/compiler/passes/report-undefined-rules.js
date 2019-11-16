"use strict";

// Checks that all referenced rules exist.
function reportUndefinedRules( ast, session, options ) {

    const check = session.buildVisitor( {
        rule_ref( node ) {

            if ( ! ast.findRule( node.name ) ) {

                session.error(
                    `Rule "${ node.name }" is not defined.`,
                    node.location,
                );

            }

        },
    } );

    check( ast );

    options.allowedStartRules.forEach( rule => {

        if ( ! ast.findRule( rule ) ) {

            session.error( `Start rule "${ rule }" is not defined.` );

        }

    } );

}

module.exports = reportUndefinedRules;
