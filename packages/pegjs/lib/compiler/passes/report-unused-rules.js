"use strict";

// Checks that all rules are used.
function reportUnusedRules( ast, session, options ) {

    const used = {};
    function yes( node ) {

        used[ node.name || node ] = true;

    }

    options.allowedStartRules.forEach( yes );
    session.buildVisitor( { rule_ref: yes } )( ast );

    ast.rules.forEach( rule => {

        if ( used[ rule.name ] !== true ) {

            session.warn(
                `Rule "${ rule.name }" is not referenced.`,
                rule.location,
            );

        }

    } );

}

module.exports = reportUnusedRules;
