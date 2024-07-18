import {lexicon} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {iterators} from "./iterators.js";
import {isMatch} from "lodash";

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
            const self = this;
            //
            // // FIXME use the grammar graph
            // //  use cover backlink graph to track the followed path
            // //  breadth visit candidates
            // function _cloneSymbol(symbol: grammar.) {
            //     if (grammar.isSymbolReference(symbol)) {
            //         return Object.assign({}, symbol);
            //     } else {
            //         return Object.assign({}, symbol, {symbols: (symbol as grammar.Group).symbols.slice()})
            //     }
            // }
            //
            // type Candidate = {
            //     parent: Candidate,
            //     rule: grammar.GrammarRule,
            //     symbol: grammar.Symbol,
            //     readonly origSymbol: grammar.Symbol
            // }
            // type Context = {
            //     matchCandidates: Candidate[]
            //     node: ast.Node
            // }
            // const startRule = self.grammar.startRule;
            // const rootContext: Context = {
            //     matchCandidates: [{
            //         parent: null,
            //         rule: startRule,
            //         symbol: _cloneSymbol(startRule.to),
            //         origSymbol: startRule.to
            //     }],
            //     node: {
            //         name: "__ROOT__",
            //         children: []
            //     }
            // };
            //
            // /*
            //  at every step we have a list of candidates
            //  for every candidate
            //  - test if it matches
            //  - if it matches find the next candidates
            //  */
            // const termsToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
            // let step = rootContext;
            // STEP_LOOP: while (step) {
            //     const nextTerm = termsToParse.peekValue();
            //     const nextStep: Context = {
            //         matchCandidates: [],
            //         node: null
            //     };
            //
            //
            //     EXPAND_SYMBOLS: for (const candidate of step.matchCandidates) {
            //         // expand groups and rule references
            //         if (grammar.isSymbolGroup(candidate.symbol)) {
            //             const symbol = candidate.symbol as grammar.Group;
            //             if (symbol.operator === "or") {
            //
            //             }
            //             nextStep.matchCandidates.push({})
            //             continue EXPAND_SYMBOLS;
            //         } else {
            //             const symbol = candidate.symbol as grammar.Reference;
            //         }
            //     }
            //
            //
            //     step = nextStep;
            //     continue STEP_LOOP;
            // }
            //

            // return rootContext.node;
            return null;
        }
    }

    export function parser(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
                           _grammar: grammar.GrammarParser | grammar.Grammar,
                           options
                               :
                               ParserOptions = undefined
    ) {
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