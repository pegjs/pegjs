import gp from "./generated-parser";

export = peg;
export as namespace peg;

declare namespace peg {

    type Grammar = ast.Grammar;
    type GeneratedParser<T = any> = gp.API<T>;
    type SyntaxError = gp.SyntaxErrorConstructor;
    type SourceLocation = gp.SourceLocation;

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
        location?: SourceLocation;

        constructor( message: string, location?: SourceLocation );

    }

    /**
     * PEG.js AST
     */
    namespace ast {

        /**
         * PEG.js node constructor, used internally by the PEG.js parser to create nodes.
         */
        class Node {

            type: string;
            location: SourceLocation;

            constructor( type: string, location: SourceLocation );

        }

        /**
         * The main PEG.js AST class returned by the parser.
         */
        class Grammar extends Node {

            // Default properties and methods

            private readonly _alwaysConsumesOnSuccess: any;
            type: "grammar";
            comments?: CommentMap;
            initializer?: Initializer;
            rules: Rule[];

            constructor(
                initializer: void | Initializer,
                rules: Rule[],
                comments: void | CommentMap,
                location: SourceLocation,
            );

            findRule( name: string ): Rule | void;
            indexOfRule( name: string ): number;
            alwaysConsumesOnSuccess( node: Object ): boolean;

            // Added by Bytecode generator

            literals?: string[];
            classes?: string[];
            expectations?: string[];
            functions?: string[];

            // Added by JavaScript generator

            code?: string;

        }

        interface CommentMap {

            [ offset: number ]: {

                text: string;
                multiline: boolean;
                location: SourceLocation;

            };

        }

        interface INode extends peg.ast.Node { }

        /**
         * This type represent's all PEG.js AST node's.
         */
        type Object
            = Grammar
            | Initializer
            | Rule
            | Named
            | Expression;

        interface Initializer extends INode {

            type: "initializer";
            code: string;

        }

        interface Rule extends INode {

            // Default properties

            type: "rule",
            name: string;
            expression: Named | Expression;

            // Added by calc-report-failures pass

            reportFailures?: boolean;

            // Added by inference-match-result pass

            match?: number;

            // Added by generate-bytecode pass

            bytecode?: number[];

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

        namespace visitor {

            interface IVisitorMap<U = void> {

                [ key: string ]: any;
                grammar?<R = U>( node: Grammar, ...args ): R;
                initializer?<R = U>( node: Initializer, ...args ): R;
                rule?<R = U>( node: Rule, ...args ): R;
                named?<R = U>( node: Named, ...args ): R;
                choice?<R = U>( node: ChoiceExpression, ...args ): R;
                action?<R = U>( node: ActionExpression, ...args ): R;
                sequence?<R = U>( node: SequenceExpression, ...args ): R;
                labeled?<R = U>( node: LabeledExpression, ...args ): R;
                text?<R = U>( node: PrefixedExpression, ...args ): R;
                simple_and?<R = U>( node: PrefixedExpression, ...args ): R;
                simple_not?<R = U>( node: PrefixedExpression, ...args ): R;
                optional?<R = U>( node: SuffixedExpression, ...args ): R;
                zero_or_more?<R = U>( node: SuffixedExpression, ...args ): R;
                one_or_more?<R = U>( node: SuffixedExpression, ...args ): R;
                literal?<R = U>( node: LiteralMatcher, ...args ): R;
                class?<R = U>( node: CharacterClassMatcher, ...args ): R;
                any?<R = U>( node: AnyMatcher, ...args ): R;
                rule_ref?<R = U>( node: RuleReferenceExpression, ...args ): R;
                semantic_and?<R = U>( node: SemanticPredicateExpression, ...args ): R;
                semantic_not?<R = U>( node: SemanticPredicateExpression, ...args ): R;
                group?<R = U>( node: GroupExpression, ...args ): R;

            }

            interface IVisitor<R = any> {

                ( node: Object, ...args ): R;

            }

            class ASTVisitor implements IVisitorMap {

                visit: IVisitor;

            }

            interface IVisitorBuilder<T = void, R = any> {

                ( functions: IVisitorMap<T> ): IVisitor<R>;

            }

            interface IOn {

                property( name: string ): IVisitor;
                children( name: string ): IVisitor;

            }

            const build: IVisitorBuilder;
            const on: IFor;

        }

        interface visitor {

            ASTVisitor: visitor.ASTVisitor;
            build: visitor.IVisitorBuilder;
            on: visitor.IOn;

        }

    }

    /**
     * A generated PEG.js parser to parse PEG.js grammar source's.
     */
    namespace parser {

        interface IOptions extends gp.IOptions {

            extractComments?: boolean;
            reservedWords?: string[];

        }

        const SyntaxError: SyntaxError;
        function parse( input: string, options?: IOptions ): Grammar;

    }

    /**
     * The PEG.js compiler.
     */
    namespace compiler {

        type FormatOptions = "amd" | "bare" | "commonjs" | "es" | "globals" | "umd";
        type OptimizeOptions = "size" | "speed";
        type OutputOptions = "parser" | "source";

        interface ICompilerOptions<T = OutputOptions> {

            [ key: string ]: any;
            allowedStartRules?: string[];
            cache?: boolean;
            context?: { [ name: string ]: any; };
            dependencies?: { [ name: string ]: string; };
            exportVar?: string;
            features?: IGeneratedParserFeatures;
            format?: FormatOptions;
            header?: string | string[];
            optimize?: OptimizeOptions;
            output?: T;
            trace?: boolean;

        }

        interface ICompilerPassOptions extends ICompilerOptions {

            allowedStartRules: string[];
            cache: boolean;
            context: { [ name: string ]: any; };
            dependencies: { [ name: string ]: string; };
            exportVar: string;
            features: IGeneratedParserFeatures;
            format: FormatOptions;
            header: string | string[];
            optimize: OptimizeOptions;
            output: OutputOptions;
            trace: boolean;

        }

        interface IGeneratedParserFeatures {

            [ key: string ]: boolean;
            text: boolean;
            offset: boolean;
            range: boolean;
            location: boolean;
            expected: boolean;
            error: boolean;
            filename: boolean;
            DefaultTracer: boolean;

        }

        interface ICompilerPass {

            ( node: Grammar ): void;
            ( node: Grammar, session: Session ): void;
            ( node: Grammar, session: Session, options: ICompilerPassOptions ): void;

        }

        interface IPassesMap {

            [ type: string ]: ICompilerPass[];

        }

        interface IOpcodes {

            [ name: string ]: number;

        }

        interface vm {

            runInContext( code: string, vm$context?: { [ name: string ]: any; } ): any;

        }
        const vm: vm;

        interface ISessionMessageEmitter {

            ( message: string, location: SourceLocation ): any;

        }

        interface ISessionConfig {

            [ key: string ]: any;
            opcodes?: IOpcodes;
            parser?: GeneratedParser<Grammar>;
            passes?: IPassesMap;
            visitor?: ast.visitor;
            vm?: vm;
            warn?: ISessionMessageEmitter;
            error?: ISessionMessageEmitter;

        }

        class Session implements ISessionConfig {

            constructor( config?: ISessionConfig );

            parse( input: string, options?: parser.IOptions ): Grammar;

            buildVisitor: ast.visitor.IVisitorBuilder;

            warn: ISessionMessageEmitter;
            error: ISessionMessageEmitter;
            fatal: ISessionMessageEmitter;

        }

        namespace passes {

            namespace check {

                function reportUndefinedRules( ast: Grammar, session: Session, options: ICompilerPassOptions ): void;
                function reportDuplicateRules( ast: Grammar, session: Session ): void;
                function reportUnusedRules( ast: Grammar, session: Session, options: ICompilerPassOptions ): void;
                function reportDuplicateLabels( ast: Grammar, session: Session ): void;
                function reportInfiniteRecursion( ast: Grammar, session: Session ): void;
                function reportInfiniteRepetition( ast: Grammar, session: Session ): void;

            }

            namespace transform {

                function removeProxyRules( ast: Grammar, session: Session, options: ICompilerPassOptions ): void;

            }

            namespace generate {

                function calcReportFailures( ast: Grammar, session: Session, options: ICompilerPassOptions ): void;
                function inferenceMatchResult( ast: Grammar, session: Session ): void;
                function generateBytecode( ast: Grammar, session: Session ): void;
                function generateJS( ast: Grammar, session: Session, options: ICompilerPassOptions ): void;

            }

        }

        /**
         * Generate's a parser from the PEG.js AST and returns it.
         */
        function compile( ast: Grammar, session: Session, options?: ICompilerOptions ): GeneratedParser | string;

        /**
         * Generate's a parser from the PEG.js AST, then evaluates's the source before returning the parser object.
         */
        function compile( ast: Grammar, session: Session, options?: ICompilerOptions<"parser"> ): GeneratedParser;

        /**
         * Generate's a parser from the PEG.js AST and returns the JavaScript based source.
         */
        function compile( ast: Grammar, session: Session, options?: ICompilerOptions<"source"> ): string;

    }

    // peg.util

    interface IStageMap {

        [ stage: string ]
            : compiler.ICompilerPass[]
            | { [ pass: string ]: compiler.ICompilerPass };

    }

    interface IIterator<R = any> {

        ( value: any ): R;
        ( value: any, key: string ): R;

    }

    interface IJavaScriptUtils {

        stringEscape( s: string ): string;
        regexpEscape( s: string ): string;
        reservedWords: string[];

    }
    interface IObjectUtils {

        clone( source: {} ): {};
        each( object: {}, iterator: IIterator<void> ): void;
        extend( target: {}, source: {} ): {};
        map( object: {}, transformer: IIterator ): {};
        values( object: {}, transformer?: IIterator ): any[];
        enforceFastProperties( o: {} ): {};

    }
    interface util extends IJavaScriptUtils, IObjectUtils {

        noop(): void;
        convertPasses( stages: IStageMap ): compiler.IPassesMap;
        processOptions( options: {}, defaults: {} ): {};

    }
    const util: util;

    // peg.generate

    interface IPlugin<T = compiler.OutputOptions> {

        [ key: string ]: any;
        use( session: compiler.Session ): void;
        use( session: compiler.Session, options: IBuildOptions<T> ): void;

    }

    interface IBuildOptions<T = compiler.OutputOptions> extends compiler.ICompilerOptions<T> {

        plugins?: IPlugin<T>[];
        parser?: parser.IOptions;

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
