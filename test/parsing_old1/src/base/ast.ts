import {lexicon} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {iterators} from "./iterators.js";

export namespace ast {

    export interface Node {
        name?: string
        children: Node[]
        content: any

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
            let tokensToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));

            type ScopedRule = {
                parentRule: grammar.ParsingRule
                rule: grammar.ParsingRule
                node: Node,
                symbols: Iterator<ScopedSymbol[]>
            }

            type ScopedSymbol = {
                parentRule: ScopedRule,
                symbol: grammar.Symbol,
                nextRuleOnMatch: grammar.ParsingRule
            }

            type Context = {
                rules: ScopedRule[]
                symbols: ScopedSymbol[]
            }

            function* _getSymbols(rule: grammar.ParsingRule): Iterator<ScopedSymbol[]> {
                /*

                 */
                let rootSymbol = rule.to;
                yield null;
            }

            return rootNode;
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