import {lexicon} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {iterators} from "./iterators.js";
import {Graph, Vertex} from "./util/Graph.js";

export namespace ast {

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

            // /*
            //  * we visit in depth, we create AstVertex setting parent
            //  * but we set children only if there is a match?
            //  * FIXME we need a better strategy
            //  */
            //
            // type WalkContext = {
            //     id: number,
            //     nesting: number,
            //     astItem: AstItem,
            //     grammarVertex: Vertex,
            //     returnContext: {
            //         ctx: WalkContext
            //     }
            // }
            //
            // const termsToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
            // const grammarGraph = this.grammar.graph;
            //
            // const rootItem: AstItem = {
            //     name: "__ROOT__",
            //     parent: null,
            //     children: []
            // }
            //
            // let nextIndex = 0;
            //
            // let toVisitH: WalkContext[] = [{ // currentWalkHighPriorityQueue
            //     id: nextIndex++,
            //     nesting: 0,
            //     astItem: rootItem,
            //     grammarVertex: grammarGraph.getVertex(this.grammar.startVertexName),
            //     returnContext: null,
            // }];
            // let toVisitL: WalkContext[] = []; // contains END symbols // currentWalkLowPriorityQueue
            //
            // let nextToVisitH: WalkContext[] = []; // nextWalkHighPriorityQueue
            // let nextToVisitL: WalkContext[] = []; // nextWalkLowPriorityQueue
            //
            // let termIterator: IteratorResult<lexicon.Term> = null;
            //
            // while ((termIterator = termsToParse.next())) {
            //     const currentTerm: lexicon.Term = termIterator.done ? {
            //         term: null,
            //         content: null
            //     } : termIterator.value;
            //     let atLeastOneMatch = termIterator.done;
            //
            //     if (this.debug) {
            //         console.debug(`Parse term '${currentTerm.term}': '${currentTerm.content.replace(/\n/g, "\\n")}'`);
            //     }
            //
            //     while (toVisitH.length || toVisitL.length) {
            //         if (this.debugAll) {
            //             console.debug(
            //                 " " +
            //                 [...toVisitH, ...toVisitL].map(x => `(${x.id} ${x.grammarVertex.name})`).join(" ")
            //             );
            //         }
            //
            //         let ctx: WalkContext = toVisitH.shift() || toVisitL.shift(),
            //             grammarVertex: Vertex = ctx.grammarVertex,
            //             grammarData: grammar.GrammarRuleVertexData = grammarVertex.data;
            //
            //         if (this.debug) {
            //             const stepType =
            //                 grammarData.isRuleStart ? "RULE_START" :
            //                     grammarData.isRuleEnd ? "RULE_END" :
            //                         grammarData.isRuleReference ? "RULE_REF" :
            //                             grammarData.isGroupStart ? "GROUP_START" :
            //                                 grammarData.isGroupEnd ? "GROUP_END" :
            //                                     grammarData.isTerminal ? "TERMINAL" :
            //                                         "UNKNOWN";
            //             /*if (this.debugAll) {
            //                 console.debug(`Parser step (${ctx.id}): ${stepType.padEnd(11)} ${ctx.grammarVertex.name.padEnd(30)}` +
            //                     ` parent=${ctx.astItem.name},` +
            //                     ` returnCtx=(${ctx.returnContext[0].id ?? ""})`);
            //             } else */
            //             if (stepType === "TERMINAL") {
            //                 console.debug(" ".repeat(ctx.nesting) + `(${ctx.id} ${ctx.astItem.originGrammarVertex.data.ruleName}/${ctx.grammarVertex.name})`);
            //             } else if (stepType === "RULE_START") {
            //                 console.debug(" ".repeat(ctx.nesting) + `(${ctx.id} ${ctx.grammarVertex?.data?.ruleName ?? "ROOT"})`);
            //             }
            //         }
            //
            //         if (grammarData.isRuleStart) {
            //             /*
            //                 Start a new rule
            //                 - create a default ast vertex
            //                     - set its parent to the current ctx parent
            //                 - expand the grammar vertex to current stack and continue
            //              */
            //             const newAstItem: AstItem = {
            //                 name: grammarData.ruleName,
            //                 parent: ctx.astItem,
            //                 children: [],
            //                 originGrammarVertex: grammarVertex,
            //                 astVertexFactoryFun: grammarData.astVertexFactoryFun,
            //             }
            //
            //             for (const childGrammarEdge of [...grammarVertex.out.values()].reverse()) {
            //                 (childGrammarEdge.to.data.isRuleEnd ?
            //                     toVisitL.unshift.bind(toVisitL) :
            //                     toVisitH.unshift.bind(toVisitH))({
            //                     id: nextIndex++,
            //                     nesting: ctx.nesting + 1,
            //                     astItem: newAstItem,
            //                     grammarVertex: childGrammarEdge.to,
            //                     returnContext: ctx.returnContext
            //                 });
            //             }
            //
            //         } else if (grammarData.isRuleEnd) {
            //             /*
            //                 A rule ends, this is an alternative relative to other symbols or
            //                 the only alternative, thus we need to expand this as if there is a match
            //                 - add current astVertex to its parent children
            //                 - use returnContext to return to the previous rule in the correct place
            //                   and continue from there
            //              */
            //             // isMatch = true; // ?
            //
            //             ctx.astItem.parent.children.push(ctx.astItem);
            //             // note we don't call astVertexFactoryFun here, we do it later when we create the Graph
            //
            //             // switch context back and continue
            //             if (ctx.returnContext == null) {
            //                 console.warn(`Parser, no return context for (${ctx.id} ${ctx.astItem.originGrammarVertex.data.ruleName}/${ctx.grammarVertex.name}))`)
            //                 break;
            //             }
            //             ctx = ctx.returnContext.ctx;
            //             grammarVertex = ctx.grammarVertex;
            //             if (grammarVertex.name === "__ROOT__") {
            //                 // FIXME
            //             }
            //             grammarData = grammarVertex.data;
            //
            //             for (const childGrammarEdge of [...grammarVertex.out.values()].reverse()) {
            //                 (childGrammarEdge.to.data.isRuleEnd ?
            //                     toVisitL.unshift.bind(toVisitL) :
            //                     toVisitH.unshift.bind(toVisitH))({
            //                     id: nextIndex++,
            //                     nesting: ctx.nesting,
            //                     astItem: ctx.astItem,
            //                     grammarVertex: childGrammarEdge.to,
            //                     returnContext: ctx.returnContext
            //                 });
            //             }
            //
            //         } else if (grammarData.isGroupStart) {
            //             /*
            //              this is a group start, just expand children contexts in current stack
            //              */
            //             for (const childGrammarEdge of [...grammarVertex.out.values()].reverse()) {
            //                 (childGrammarEdge.to.data.isRuleEnd ?
            //                     toVisitL.unshift.bind(toVisitL) :
            //                     toVisitH.unshift.bind(toVisitH))({
            //                     id: nextIndex++,
            //                     nesting: ctx.nesting + 1,
            //                     astItem: ctx.astItem,
            //                     grammarVertex: childGrammarEdge.to,
            //                     returnContext: ctx.returnContext
            //                 });
            //             }
            //
            //         } else if (grammarData.isGroupEnd) {
            //             /*
            //              this is a group end, just expand children contexts in current stack
            //              */
            //             for (const childGrammarEdge of [...grammarVertex.out.values()].reverse()) {
            //                 (childGrammarEdge.to.data.isRuleEnd ?
            //                     toVisitL.unshift.bind(toVisitL) :
            //                     toVisitH.unshift.bind(toVisitH))({
            //                     id: nextIndex++,
            //                     nesting: ctx.nesting - 1,
            //                     astItem: ctx.astItem,
            //                     grammarVertex: childGrammarEdge.to,
            //                     returnContext: ctx.returnContext
            //                 });
            //             }
            //
            //         } else if (grammarData.isRuleReference) {
            //             /*
            //              this is a rule reference
            //              - find the matching rule from the grammarGraph
            //              - create a new context and set return context to current
            //              */
            //             const nextGrammarVertex = grammarGraph.getVertex(grammarData.expectedVertexName);
            //             if (!nextGrammarVertex) {
            //                 throw new Error(`Vertex not found: ${grammarData.expectedVertexName}`);
            //             }
            //             toVisitH.unshift({
            //                 id: nextIndex++,
            //                 nesting: ctx.nesting,
            //                 astItem: ctx.astItem,
            //                 grammarVertex: nextGrammarVertex,
            //                 returnContext: {
            //                     ctx: ctx
            //                 }
            //             })
            //
            //         } else if (grammarData.isTerminal) {
            //             /*
            //              this is terminal, thus it MUST MATCHES the currentTerm
            //              if OK
            //                 - create a leaf AstItem and add it to parent children
            //                 - push child contexts in the next stack
            //              */
            //             const isMatch = grammarData.expectedTerm === currentTerm.term;
            //             atLeastOneMatch = atLeastOneMatch || isMatch;
            //
            //             if (isMatch) {
            //                 console.debug(`Parser found a match: ${currentTerm.term}`);
            //
            //                 const leafAstItem: AstItem = {
            //                     name: currentTerm.term,
            //                     content: currentTerm.content,
            //                     parent: ctx.astItem,
            //                     children: [],
            //                     originGrammarVertex: grammarVertex,
            //                     astVertexFactoryFun: grammarData.astVertexFactoryFun
            //                 };
            //
            //                 ctx.astItem.children.push(leafAstItem);
            //
            //                 for (const childGrammarEdge of [...grammarVertex.out.values()].reverse()) {
            //                     (childGrammarEdge.to.data.isRuleEnd ?
            //                         nextToVisitL.unshift.bind(nextToVisitL) :
            //                         nextToVisitH.unshift.bind(nextToVisitH))({
            //                         id: nextIndex++,
            //                         nesting: ctx.nesting,
            //                         astItem: ctx.astItem,
            //                         grammarVertex: childGrammarEdge.to,
            //                         returnContext: ctx.returnContext,
            //                     });
            //                 }
            //             }
            //
            //         } else {
            //             throw new Error(`Not implemented branch for grammar data: ${JSON.stringify(grammarData)}`);
            //         }
            //     } // end inner while
            //
            //     if (!atLeastOneMatch) {
            //         // FIXME error! no match for currentToken
            //         // const nextTerms = [...termsToParse].slice(0, 6).map(t => t.term).join("\n ");
            //         // console.error(`Parser stops, no match for term '${currentTerm.term}'. \n Next terms:\n ${nextTerms}`);
            //         const content = [currentTerm, ...termsToParse].slice(0, 6).map(t => t.content).join(" ");
            //         console.error(`Parser stops, no match for term '${currentTerm.term}': '${currentTerm.content}' at \n${content}`);
            //         break;
            //     }
            //
            //     if (termIterator.done) {
            //         break;
            //     }
            //
            //     toVisitH = nextToVisitH;
            //     nextToVisitH = [];
            //     toVisitL = nextToVisitL;
            //     nextToVisitL = [];
            // }

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