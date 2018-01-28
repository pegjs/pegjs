"use strict";

const visitor = require( "../../ast" ).visitor;

// Removes proxy rules -- that is, rules that only delegate to other rule.
function removeProxyRules( ast, options ) {

    function isProxyRule( node ) {

        return node.type === "rule" && node.expression.type === "rule_ref";

    }

    function replaceRuleRefs( ast, from, to ) {

        const replace = visitor.build( {
            rule_ref( node ) {

                if ( node.name === from ) {

                    node.name = to;

                }

            }
        } );

        replace( ast );

    }

    const indices = [];

    ast.rules.forEach( ( rule, i ) => {

        if ( isProxyRule( rule ) ) {

            replaceRuleRefs( ast, rule.name, rule.expression.name );
            if ( options.allowedStartRules.indexOf( rule.name ) === -1 ) {

                indices.push( i );

            }

        }

    } );

    indices.reverse();

    indices.forEach( i => {

        ast.rules.splice( i, 1 );

    } );

}

module.exports = removeProxyRules;
