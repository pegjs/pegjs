"use strict";

// Reports expressions that don't consume any input inside |*| or |+| in the
// grammar, which prevents infinite loops in the generated parser.
function reportInfiniteRepetition( ast, session ) {

    const check = session.buildVisitor( {
        zero_or_more( node ) {

            if ( ! ast.alwaysConsumesOnSuccess( node.expression ) ) {

                session.error(
                    "Possible infinite loop when parsing (repetition used with an expression that may not consume any input).",
                    node.location,
                );

            }

        },

        one_or_more( node ) {

            if ( ! ast.alwaysConsumesOnSuccess( node.expression ) ) {

                session.error(
                    "Possible infinite loop when parsing (repetition used with an expression that may not consume any input).",
                    node.location,
                );

            }

        },
    } );

    check( ast );

}

module.exports = reportInfiniteRepetition;
