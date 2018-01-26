"use strict";

const visitor      = require( "../visitor" );
const GrammarError = require( "../../grammar-error" );

// Inference match result of the rule. Can be:
//   -1: negative result, always fails
//    0: neutral result, may be fail, may be match
//    1: positive result, always match
function inferenceMatchResult( ast ) {

    let inference;
    function sometimesMatch( node ) {

        node.match = 0;

        return node.match;

    }
    function alwaysMatch( node ) {

        inference( node.expression );

        node.match = 1;

        return node.match;

    }

    function inferenceExpression( node ) {

        node.match = inference( node.expression );

        return node.match;

    }
    function inferenceElements( elements, forChoice ) {

        const length = elements.length;
        let always = 0;
        let never = 0;

        for ( let i = 0; i < length; ++i ) {

            const result = inference( elements[ i ] );

            if ( result > 0 ) {

                ++always;

            }
            if ( result < 0 ) {

                ++never;

            }

        }

        if ( always === length ) {

            return 1;

        }
        if ( forChoice ) {

            return never === length ? -1 : 0;

        }

        return never > 0 ? -1 : 0;

    }

    inference = visitor.build( {
        rule( node ) {

            let oldResult;
            let count = 0;

            if ( typeof node.match === "undefined" ) {

                node.match = 0;
                do {

                    oldResult = node.match;
                    node.match = inference( node.expression );
                    // 6 == 3! -- permutations count for all transitions from one match
                    // state to another.
                    // After 6 iterations the cycle with guarantee begins
                    // istanbul ignore next
                    if ( ++count > 6 ) {

                        throw new GrammarError(
                            "Infinity cycle detected when trying evaluate node match result",
                            node.location
                        );

                    }

                } while ( oldResult !== node.match );

            }

            return node.match;

        },
        named:        inferenceExpression,
        choice( node ) {

            node.match = inferenceElements( node.alternatives, true );

            return node.match;

        },
        action:       inferenceExpression,
        sequence( node ) {

            node.match = inferenceElements( node.elements, false );

            return node.match;

        },
        labeled:      inferenceExpression,
        text:         inferenceExpression,
        simple_and:   inferenceExpression,
        simple_not( node ) {

            node.match = -inference( node.expression );

            return node.match;

        },
        optional:     alwaysMatch,
        zero_or_more: alwaysMatch,
        one_or_more:  inferenceExpression,
        group:        inferenceExpression,
        semantic_and: sometimesMatch,
        semantic_not: sometimesMatch,
        rule_ref( node ) {

            const rule = ast.findRule( node.name );
            node.match = inference( rule );

            return node.match;

        },
        literal( node ) {

            // Empty literal always match on any input
            node.match = node.value.length === 0 ? 1 : 0;

            return node.match;

        },
        class( node ) {

            // Empty character class never match on any input
            node.match = node.parts.length === 0 ? -1 : 0;

            return node.match;

        },
        // |any| not match on empty input
        any:          sometimesMatch
    } );

    inference( ast );

}

module.exports = inferenceMatchResult;
