import gp from "./generated-parser";

export = peg;
export as namespace peg;

declare namespace peg {

    type Grammar = parser.ast.Grammar;
    type GeneratedParser<T = any> = gp.API<T>;
    type SyntaxError = gp.SyntaxErrorConstructor;

    /**
     * PEG.js version (uses semantic versioning).
     */
    const VERSION: string;

    /**
     * Thrown when the grammar contains an error.
     */
    class GrammarError {

        name: string;
        message: string;
        location?: gp.SourceLocation;

        constructor( message: string, location?: gp.SourceLocation );

    }

    /**
     * A generated PEG.js parser to parse PEG.js grammar source's.
     */
    namespace parser {

        /**
         * Interface's that describe the abstact sytax tree used by PEG.js
         */
        namespace ast {

            /**
             * Unlike `parser.ast.INode` this interface represent's all PEG.js node's.
             */
            type Node
                = Grammar
                | Initializer
                | Rule
                | Named
                | Expression;

            /**
             * Basic representation of a PEG.js node.
             */
            interface INode {

                type: string;
                location: gp.SourceLocation;

            }

            interface Grammar extends INode {

                // Default properties

                type: "grammar";
                initializer?: Initializer;
                rules: Rule[];

                // Added by Bytecode generator

                consts?: string[];

                // Added by JavaScript generator

                code?: string;

            }

            interface Initializer extends INode {

                type: "initializer";
                code: string;

            }

            interface Rule extends INode {

                // Default properties

                type: "rule",
                name: string;
                expression: Named | Expression;

                // Added by bytecode generator

                bytecode?: number[];

                // Added by calc-report-failures pass

                reportFailures?: boolean;

            }

            interface Named extends INode {

                type: "named";
                name: string;
                expression: Expression;

            }

            type Expression
                = ChoiceExpression
                | ActionExpression
                | SequenceExpression
                | LabeledExpression
                | PrefixedExpression
                | SuffixedExpression
                | PrimaryExpression;

            interface ChoiceExpression extends INode {

                type: "choice";
                alternatives: (
                    ActionExpression
                    | SequenceExpression
                    | LabeledExpression
                    | PrefixedExpression
                    | SuffixedExpression
                    | PrimaryExpression
                )[];

            }

            interface ActionExpression extends INode {

                type: "action";
                expression: (
                    SequenceExpression
                    | LabeledExpression
                    | PrefixedExpression
                    | SuffixedExpression
                    | PrimaryExpression
                );
                code: string;

            }

            interface SequenceExpression extends INode {

                type: "sequence",
                elements: (
                    LabeledExpression
                    | PrefixedExpression
                    | SuffixedExpression
                    | PrimaryExpression
                )[];

            }

            interface LabeledExpression extends INode {

                type: "labeled";
                label: string;
                expression: (
                    PrefixedExpression
                    | SuffixedExpression
                    | PrimaryExpression
                );

            }

            interface PrefixedExpression extends INode {

                type: "text" | "simple_and" | "simple_not";
                expression: SuffixedExpression | PrimaryExpression;

            }

            interface SuffixedExpression extends INode {

                type: "optional" | "zero_or_more" | "one_or_more";
                expression: PrimaryExpression;

            }

            type PrimaryExpression
                = LiteralMatcher
                | CharacterClassMatcher
                | AnyMatcher
                | RuleReferenceExpression
                | SemanticPredicateExpression
                | GroupExpression;

            interface LiteralMatcher extends INode {

                type: "literal";
                value: string;
                ignoreCase: boolean;

            }

            interface CharacterClassMatcher extends INode {

                type: "class";
                parts: ( string[] | string )[];
                inverted: boolean;
                ignoreCase: boolean;

            }

            interface AnyMatcher extends INode {

                type: "any";

            }

            interface RuleReferenceExpression extends INode {

                type: "rule_ref";
                name: string;

            }

            interface SemanticPredicateExpression extends INode {

                type: "semantic_and" | "semantic_not";
                code: string;

            }

            interface GroupExpression extends INode {

                type: "group";
                expression: LabeledExpression | SequenceExpression;

            }

        }

        const SyntaxError: SyntaxError;
        function parse( input: string, options?: gp.IOptions ): Grammar;

    }

    namespace compiler {

        type FormatOptions = "amd" | "bare" | "commonjs" | "es" | "globals" | "umd";
        type OptimizeOptions = "size" | "speed";
        type OutputOptions = "parser" | "source";

        interface ICompilerOptions<T = OutputOptions> {

            [ key: string ]: any;
            allowedStartRules?: string[];
            cache?: boolean;
            dependencies?: { [ name: string ]: string; };
            exportVar?: string;
            format?: FormatOptions;
            header?: string | string[];
            optimize?: OptimizeOptions;
            output?: T;
            trace?: boolean;

        }

        interface ICompilerPassOptions extends ICompilerOptions {

            allowedStartRules: string[];
            cache: boolean;
            dependencies: { [ name: string ]: string; };
            exportVar: string;
            format: FormatOptions;
            header: string | string[];
            optimize: OptimizeOptions;
            output: OutputOptions;
            trace: boolean;

        }

        interface ICompilerPass {

            ( node: Grammar ): void;
            ( node: Grammar, options: ICompilerPassOptions ): void;

        }

        interface IPassesMap {

            [ type: string ]: ICompilerPass[];

        }

        namespace visitor {

            interface Visitor<R = any> {

                ( node: Node, ...args ): R;

            }

            interface VisitorMap<U = void> {

                [ type: string ]: any;
                grammar<R = U>( node: Grammar, ...args ): R;
                initializer<R = U>( node: parser.ast.Initializer, ...args ): R;
                rule<R = U>( node: parser.ast.Rule, ...args ): R;
                named<R = U>( node: parser.ast.Named, ...args ): R;
                choice<R = U>( node: parser.ast.ChoiceExpression, ...args ): R;
                action<R = U>( node: parser.ast.ActionExpression, ...args ): R;
                sequence<R = U>( node: parser.ast.SequenceExpression, ...args ): R;
                labeled<R = U>( node: parser.ast.LabeledExpression, ...args ): R;
                text<R = U>( node: parser.ast.PrefixedExpression, ...args ): R;
                simple_and<R = U>( node: parser.ast.PrefixedExpression, ...args ): R;
                simple_not<R = U>( node: parser.ast.PrefixedExpression, ...args ): R;
                optional<R = U>( node: parser.ast.SuffixedExpression, ...args ): R;
                zero_or_more<R = U>( node: parser.ast.SuffixedExpression, ...args ): R;
                one_or_more<R = U>( node: parser.ast.SuffixedExpression, ...args ): R;
                literal<R = U>( node: parser.ast.LiteralMatcher, ...args ): R;
                class<R = U>( node: parser.ast.CharacterClassMatcher, ...args ): R;
                any<R = U>( node: parser.ast.AnyMatcher, ...args ): R;
                rule_ref<R = U>( node: parser.ast.RuleReferenceExpression, ...args ): R;
                semantic_and<R = U>( node: parser.ast.SemanticPredicateExpression, ...args ): R;
                semantic_not<R = U>( node: parser.ast.SemanticPredicateExpression, ...args ): R;
                group<R = U>( node: parser.ast.GroupExpression, ...args ): R;

            }

            function build<T = void, R = any>( functions: VisitorMap<T> ): Visitor<R>;

        }

        namespace passes {

            namespace check {

                function reportUndefinedRules( ast: Grammar, options: ICompilerPassOptions ): void;
                function reportDuplicateRules( ast: Grammar ): void;
                function reportDuplicateLabels( ast: Grammar ): void;
                function reportInfiniteRecursion( ast: Grammar ): void;
                function reportInfiniteRepetition( ast: Grammar ): void;

            }

            namespace transform {

                function removeProxyRules( ast: Grammar, options: ICompilerPassOptions ): void;
                function calcReportFailures( ast: Grammar, options: ICompilerPassOptions ): void;

            }

            namespace generate {

                function generateBytecode( ast: Grammar ): void;
                function generateJS( ast: Grammar, options: ICompilerPassOptions ): void;

            }

        }

        /**
         * Generate's a parser from the PEG.js AST and returns it.
         */
        function compile( ast: Grammar, passes: IPassesMap, options?: ICompilerOptions ): GeneratedParser | string;

        /**
         * Generate's a parser from the PEG.js AST, then evaluates's the source before returning the parser object.
         */
        function compile( ast: Grammar, passes: IPassesMap, options?: ICompilerOptions<"parser"> ): GeneratedParser;

        /**
         * Generate's a parser from the PEG.js AST and returns the JavaScript based source.
         */
        function compile( ast: Grammar, passes: IPassesMap, options?: ICompilerOptions<"source"> ): string;

    }

    interface IBuildConfig<T = any> {

        parser: GeneratedParser<T>;
        passes: compiler.IPassesMap;

    }

    interface IPlugin<T = compiler.OutputOptions, U = any> {

        [ key: string ]: any;
        use( config: IBuildConfig<U> ): void;
        use( config: IBuildConfig<U>, options: IBuildOptions<T> ): void;

    }

    interface IBuildOptions<T = compiler.OutputOptions> extends compiler.ICompilerOptions<T> {

        plugins?: IPlugin<T>[];

    }

    /**
     * Generate's a parser from the PEG.js grammar and returns it.
     */
    function generate( grammar: string, options?: IBuildOptions ): GeneratedParser | string;

    /**
     * Generate's a parser from the PEG.js grammar, then evaluates's the source before returning the parser object.
     */
    function generate( grammar: string, options?: IBuildOptions<"parser"> ): GeneratedParser;

    /**
     * Generate's a parser from the PEG.js grammar and returns the JavaScript based source.
     */
    function generate( grammar: string, options?: IBuildOptions<"source"> ): string;

}
