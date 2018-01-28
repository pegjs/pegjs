"use strict";

const visitor = require( "../../ast" ).visitor;

// Determines if rule always used in disabled report failure context,
// that means, that any failures, reported within it, are never will be
// visible, so the no need to report it.
function calcReportFailures( ast, options ) {

    // By default, not report failures for rules...
    ast.rules.forEach( rule => {

        rule.reportFailures = false;

    } );

    // ...but report for start rules, because in that context report failures
    // always enabled
    const changedRules = options.allowedStartRules.map( name => {

        const rule = ast.findRule( name );

        rule.reportFailures = true;

        return rule;

    } );

    const calc = visitor.build( {
        rule( node ) {

            calc( node.expression );

        },

        // Because all rules already by default marked as not report any failures
        // just break AST traversing when we need mark all referenced rules from
        // this sub-AST as always not report anything (of course if it not be
        // already marked as report failures).
        named() {},

        rule_ref( node ) {

            const rule = ast.findRule( node.name );

            // This function only called when rule can report failures. If so, we
            // need recalculate all rules that referenced from it. But do not do
            // this twice - if rule is already marked, it was in `changedRules`.
            if ( ! rule.reportFailures ) {

                rule.reportFailures = true;
                changedRules.push( rule );

            }

        }
    } );

    while ( changedRules.length > 0 ) {

        calc( changedRules.pop() );

    }

}

module.exports = calcReportFailures;
