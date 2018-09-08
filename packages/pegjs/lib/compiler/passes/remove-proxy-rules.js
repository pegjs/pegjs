"use strict";

// Removes proxy rules -- that is, rules that only delegate to other rule.
function removeProxyRules( ast, session, options ) {

    function isProxyRule( node ) {

        return node.type === "rule" && node.expression.type === "rule_ref";

    }

    const replaceRuleRefs = session.buildVisitor( {

        rule_ref( node, proxy, real ) {

            if ( node.name === proxy ) node.name = real;

        }

    } );

    const allowedStartRules = options.allowedStartRules;
    const rules = [];

    for ( const rule of ast.rules ) {

        if ( isProxyRule( rule ) ) {

            replaceRuleRefs( ast, rule.name, rule.expression.name );
            if ( allowedStartRules.indexOf( rule.name ) < 0 ) continue;

        }

        rules.push( rule );

    }

    ast.rules = rules;

}

module.exports = removeProxyRules;
