import {lexicon} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {Graph, Vertex} from "./util/Graph.js";
import GrammarNodeType = grammar.GrammarNodeType;

export namespace ast {

    import GrammarNode = grammar.GrammarNode;
    export let AstGraph = Graph;

    export interface AstItem {
        name: string,
        content?: any,
        parent: AstItem,
        children: AstItem[]
        originGrammarVertex?: Vertex
        astVertexFactoryFun?: AstNodeFactoryFun

        // [x: string]: any
    }

    export interface AstVertexFactoryContext {
        data?: AstItem,
        traceId: number,
    }

    export type AstNodeFactoryFun = (ctx: AstVertexFactoryContext) => Vertex | Vertex[];

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
                _grammar = grammar.parser(_grammar, {debug: this.debug});
            }
            this.tokenizer = _tokenizer as lexicon.Lexer;
            this.grammar = _grammar as grammar.GrammarParser;
        }

        parse(raw: string): Graph {
            const self = this;

            // const termsToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
            const termsToParse = this.tokenizer.tokenize((raw));
            const startRule = this.grammar.startNode;
            const rules = this.grammar.nodes;

            /*
                for every input term we must check all candidates (OR)
                and continue to the next symbols and term with the paths that match the term
             */

            type WalkNode = {
                id: number,
                nesting: number,
                previous: WalkNode,
                return?: WalkNode
                grammarNode: GrammarNode,
                ruleGrammarNode?: GrammarNode
            }

            let nextIndex = 0;

            const rootWalkNode: WalkNode = {
                id: nextIndex++,
                nesting: 0,
                previous: null,
                grammarNode: this.grammar.startNode,
                ruleGrammarNode: this.grammar.startNode
            }

            let endWalkNode: WalkNode = null,
                lastVisit: WalkNode = null;
            let toVisitCurrent: WalkNode[] = [rootWalkNode],
                toVisitNext: WalkNode[] = [];

            let termIterator: IteratorResult<lexicon.Term> = null;

            while ((termIterator = termsToParse.next())) {
                // termIterator can be done, in that case we need to reach the END of all symbols to visit
                // without further match
                const currentTerm = termIterator.value;
                if (this.debug) {
                    console.debug(`Parse ${currentTerm?.term}`);
                }
                const visitedCurrent: Set<any> = new Set();
                while (toVisitCurrent.length) {
                    const currentWalkNode = lastVisit = toVisitCurrent.shift();
                    // avoid to visit the same node for this token
                    // NOTE, it was already visited somewhere, its result already matched
                    // if (visitedCurrent.has(currentWalkNode.ruleGrammarNode.id)) {
                    //     continue;
                    // }
                    // visitedCurrent.add(currentWalkNode.ruleGrammarNode.id);

                    const currentGrammarNode = currentWalkNode.grammarNode;
                    if (this.debug) {
                        console.debug(` ${" ".repeat(currentWalkNode.nesting)}(${currentWalkNode.id}) ${currentGrammarNode.id}`);
                    }
                    switch (currentGrammarNode.nodeType) {
                        case grammar.GrammarNodeType.RULE_START:
                        case grammar.GrammarNodeType.GROUP_START:
                        case grammar.GrammarNodeType.GROUP_END:
                            toVisitCurrent.unshift(...[...currentGrammarNode.children.values()]
                                .map(n => {
                                    return {
                                        id: nextIndex++,
                                        nesting: currentWalkNode.nesting + (currentGrammarNode.nodeType === GrammarNodeType.GROUP_END ? -1 : +1),
                                        previous: currentWalkNode,
                                        grammarNode: n,
                                        ruleGrammarNode: currentWalkNode.ruleGrammarNode,
                                        return: currentWalkNode.return
                                    }
                                }));
                            break;
                        case grammar.GrammarNodeType.RULE_END:
                            const returnWalkNode = currentWalkNode.return
                            if (returnWalkNode) {
                                toVisitCurrent.unshift(...[...returnWalkNode.ruleGrammarNode.children]
                                    .map(n => {
                                        return {
                                            id: nextIndex++,
                                            nesting: returnWalkNode.nesting + 1,
                                            previous: returnWalkNode,
                                            grammarNode: n,
                                            ruleGrammarNode: returnWalkNode.ruleGrammarNode,
                                            return: returnWalkNode.return
                                        }
                                    }));
                            } else {
                                if (currentTerm != null) {
                                    console.warn("Parse error: grammar ends but input is not fully parsed");
                                }
                                // continue just to be sure there is a better match
                                endWalkNode = currentWalkNode;
                            }
                            break;
                        case grammar.GrammarNodeType.RULE_REFERENCE:
                            const nextGrammarNode = this.grammar.nodes.get(currentGrammarNode.mustExpandToRuleName);
                            toVisitCurrent.unshift({
                                id: nextIndex++,
                                nesting: currentWalkNode.nesting + 1,
                                previous: currentWalkNode,
                                grammarNode: nextGrammarNode,
                                ruleGrammarNode: nextGrammarNode,
                                return: currentWalkNode
                            });
                            break;
                        case grammar.GrammarNodeType.TERMINAL:
                            if (currentGrammarNode.mustMatchTerm === currentTerm?.term) {
                                if (this.debug) {
                                    console.debug(`> Match ${currentTerm?.term}`)
                                }
                                toVisitNext.unshift(...[...currentGrammarNode.children.values()]
                                    .map(n => {
                                        return {
                                            id: nextIndex++,
                                            nesting: currentWalkNode.nesting,
                                            previous: currentWalkNode,
                                            grammarNode: n,
                                            ruleGrammarNode: currentWalkNode.ruleGrammarNode,
                                            return: currentWalkNode.return
                                        }
                                    }));
                            }
                            break;
                        default:
                            throw new Error(`Parsing error: grammar node type not implemented: ${currentGrammarNode.nodeType}`);
                    }

                } // end single toVisit element visit

                toVisitCurrent = toVisitNext;
                toVisitNext = [];

                if (termIterator.done || endWalkNode) {
                    break;
                }
            } // end term visit

            if (!endWalkNode || endWalkNode.ruleGrammarNode.groupStartNode !== rootWalkNode.grammarNode) {
                console.error(`Parsing error: input doesn't match the grammar`)
            }

            if (!termIterator.done) {
                const currentTerm = termIterator.value;
                const content = [currentTerm, ...termsToParse].slice(0, 6).map(t => t.content).join(" ");
                console.error(`Parser error: parser stops, no match for term '${currentTerm.term}': '${currentTerm.content}' at \n${content}`);
            }

            // FIXME starting from the endWalkNode follow the parent and rebuild the full hierarchy

            const outputGraph = new AstGraph();
            // start from rootItem and populate the graph accordingly

            // FIXME populate
            return outputGraph;
        }
    }

    export function parser(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
                           _grammar: grammar.GrammarParser | grammar.Grammar,
                           options: ParserOptions = undefined
    ) {
        return new Parser(_tokenizer, _grammar, options);
    }

    export namespace nodeFactory {

        export function identity(ctx: AstVertexFactoryContext): Vertex | Vertex[] {
            return null;
            // return ctx.data;
        }

        export function mergeUp(ctx: AstVertexFactoryContext): Vertex | Vertex[] {
            return null;
            // return ctx.data.children;
        }

        export function ignore(ctx: AstVertexFactoryContext): Vertex | Vertex[] {
            return null;
        }

    }
}