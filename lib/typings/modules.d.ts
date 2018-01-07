/// <reference path="./api.d.ts" />

declare module "pegjs" {

    export default peg;

}

declare module "pegjs/lib/grammar-error" {

    export default peg.GrammarError;

}

declare module "pegjs/lib/parser" {

    export default peg.parser;

}

declare module "pegjs/lib/peg" {

    export default peg;

}

declare module "pegjs/lib/compiler" {

    export default peg.compiler;

}

declare module "pegjs/lib/compiler/asts" {

    namespace asts {

        function findRule( ast: peg.Grammar, name: string ): peg.parser.ast.Rule | void;
        function indexOfRule( ast: peg.Grammar, name: string ): number;
        function alwaysConsumesOnSuccess( ast: peg.Grammar, node: peg.parser.ast.Node ): boolean;

    }
    export default asts;

}

declare module "pegjs/lib/compiler/index" {

    export default peg.compiler;

}

declare module "pegjs/lib/compiler/js" {

    namespace js {

        function stringEscape( s: string ): string;
        function regexpClassEscape( s: string ): string;

    }
    export default js;

}

declare module "pegjs/lib/compiler/opcodes" {

    const opcodes: { [ name: string ]: number };
    export default opcodes;

}

declare module "pegjs/lib/compiler/visitor" {

    export default peg.compiler.visitor;

}

declare module "pegjs/lib/compiler/passes/calc-report-failures" {

    export default peg.compiler.passes.generate.calcReportFailures;

}

declare module "pegjs/lib/compiler/passes/generate-bytecode" {

    export default peg.compiler.passes.generate.generateBytecode;

}

declare module "pegjs/lib/compiler/passes/generate-js" {

    export default peg.compiler.passes.generate.generateJS;

}

declare module "pegjs/lib/compiler/passes/inference-match-result" {

    export default peg.compiler.passes.generate.inferenceMatchResult;

}

declare module "pegjs/lib/compiler/passes/remove-proxy-rules" {

    export default peg.compiler.passes.transform.removeProxyRules;

}

declare module "pegjs/lib/compiler/passes/report-duplicate-labels" {

    export default peg.compiler.passes.check.reportDuplicateLabels;

}

declare module "pegjs/lib/compiler/passes/report-duplicate-rules" {

    export default peg.compiler.passes.check.reportDuplicateRules;

}

declare module "pegjs/lib/compiler/passes/report-infinite-recursion" {

    export default peg.compiler.passes.check.reportInfiniteRecursion;

}

declare module "pegjs/lib/compiler/passes/report-infinite-repetition" {

    export default peg.compiler.passes.check.reportInfiniteRepetition;

}

declare module "pegjs/lib/compiler/passes/report-undefined-rules" {

    export default peg.compiler.passes.check.reportUndefinedRules;

}
