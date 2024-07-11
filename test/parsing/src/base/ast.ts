import {lexicon} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {iterators} from "./iterators.js";

export namespace ast {

    export interface Node {
        name?: string
        children: Node[]
        content?: any

        [x: string]: any
    }

    export interface NodeFactoryContext {
        node?: Node,
        traceId: number,
    }

    export type NodeFactoryFun = (ctx: NodeFactoryContext) => Node | Node[];

    export interface ParserOptions {
        debug?: boolean
        debugAll?: boolean
    }

    export class Parser {
        log = console
        tokenizer: lexicon.Lexer;
        grammar: grammar.GrammarParser;
        debug = false;
        debugAll = false;

        constructor(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
                    _grammar: grammar.GrammarParser | grammar.Grammar,
                    options: ParserOptions = undefined) {
            this.debug = options?.debug ?? false;
            this.debugAll = this.debug && (options?.debugAll ?? false);
            if (Array.isArray(_tokenizer)) {
                _tokenizer = lexicon.lexer(_tokenizer);
            }
            if (Array.isArray(_grammar)) {
                _grammar = grammar.parser(_grammar);
            }
            this.tokenizer = _tokenizer as lexicon.Lexer;
            this.grammar = _grammar as grammar.GrammarParser;
        }

        parse(raw: string): Node {
            type ParsingContext = {
                rules: grammar.ParsingRule[],
                expectedSymbols: {
                    symbol: grammar.Symbol
                }[],
                children: ParsingContext[],
                outputNode: Node
            }

            function* _expected(context: ParsingContext): Generator<ParsingContext> {
                /*
                 * this generator is initialized with the root context
                 * this generator accepts a symbol on .next(symbol)
                 * then advances the parsing context only with matching expected symbols
                 * the new context is a child of previous context
                 * if there are no more expected symbols the current context is closed
                 * and we go up by one context.
                 */

                let actualSymbol: lexicon.Term = (yield context) as lexicon.Term;
                console.log(actualSymbol)

                return context;
            }

            let rootContext: ParsingContext = {
                rules: [this.grammar.startRule],
                expectedSymbols: [{
                    symbol: this.grammar.startRule.to
                }],
                children: [] as ParsingContext[],
                outputNode: {
                    name: "document",
                    children: []
                }
            }

            let termsToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
            let ctxGenerator: Generator<ParsingContext> = _expected(rootContext);
            let nextTerm: IteratorResult<lexicon.Term>;
            let nextCtx: IteratorResult<ParsingContext>;

            while (true) {
                nextTerm = termsToParse.next()
                if (nextTerm.done) {
                    break;
                }
                nextCtx = ctxGenerator.next(nextTerm.value);
                if (nextCtx.done) {
                    break;
                }
            }

            if (!nextTerm.done) {
                let nextTerms = [nextTerm.value, ...termsToParse].slice(0, 6).map(x => JSON.stringify(x)).join("\n ");

                let trace_info = {
                    // node: trace.lastFail?.node?.name,
                    // traceId: trace.lastFail?.traceId,
                    // nextToken: trace.lastFail?.nextToken?.term,
                    // nextTokenIndex: trace.lastFail?.nextTokenIndex
                }
                this.log.warn(`Parsing stops: \n${JSON.stringify(trace_info, null, 2)} \nNon-parsed terms:\n ${nextTerms}`)

            }

            return rootContext.outputNode;
        }

    }

    export function parser(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
                           _grammar: grammar.GrammarParser | grammar.Grammar,
                           options: ParserOptions = undefined) {
        return new Parser(_tokenizer, _grammar, options);
    }

    export namespace nodeFactory {

        export function identity(ctx: NodeFactoryContext): Node | Node[] {
            return ctx.node;
        }

        export function mergeUp(ctx: NodeFactoryContext): Node | Node[] {
            return ctx.node.children;
        }

        export function ignore(ctx: NodeFactoryContext): Node | Node[] {
            return null;
        }

    }
}