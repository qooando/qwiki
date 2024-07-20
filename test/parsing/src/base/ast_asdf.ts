// import {lexicon} from "./lexicon.js";
// import {grammar} from "./grammar.js";
// import {iterators} from "./iterators.js";
// import {Symbol} from "./grammar";
//
// export namespace ast {
//
//     import isSymbolReference = grammar.isSymbolReference;
//     import isSymbolGroup = grammar.isSymbolGroup;
//
//     export interface Node {
//         name?: string
//         children: Node[]
//         content?: any
//
//         [x: string]: any
//     }
//
//     export interface NodeFactoryContext {
//         node?: Node,
//         traceId: number,
//     }
//
//     export type NodeFactoryFun = (ctx: NodeFactoryContext) => Node | Node[];
//
//     export interface ParserOptions {
//         debug?: boolean
//         debugAll?: boolean
//     }
//
//     export class Parser {
//         log = console
//         tokenizer: lexicon.Lexer;
//         grammar: grammar.GrammarParser;
//         debug = false;
//         debugAll = false;
//         export
//         function
//         export
//         namespace
//         nodeFactory
//         export
//         function
//         export {
//         function
//         export
//         function
//         const
//         termsToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
//         const
//         terminalSymbols = _terminalSymbols(this.grammar.startRule);
//         const
//         rootContext = terminalSymbols.next();
//         let
//         ctx = rootContext;
//         ctx
//         done
//         let!
//         term = termsToParse.peekValue(); // get next symbol, but do not remove from buffer
//     .
//         term
//     ) {
//         // FIXME check if current context is consistent with an end of all symbols
//         break;
//         let
//         isMatch = ((ctx.value as ExpectedSymbolContext).symbol as grammar.Reference).name == term.value;
//
//     !
//         else
//         ctx = terminalSymbols.next(AcceptanceChoice.DISCARD);
//         ctx
//         done
//         let!
//         nextTerms = [...termsToParse].slice(0, 6).map(x => JSON.stringify(x)).join("\n ");
//     .
//         let
//     ) {
//         trace_info = {
//             // node: trace.lastFail?.node?.name,
//             // traceId: trace.lastFail?.traceId,
//             // nextToken: trace.lastFail?.nextToken?.term,
//             // nextTokenIndex: trace.lastFail?.nextTokenIndex
//         }
//         this
//         log
//
//         constructor(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
//                     _grammar: grammar.GrammarParser | grammar.Grammar,
//                     options: ParserOptions = undefined) {
//             this.debug = options?.debug ?? false;
//             this.debugAll = this.debug && (options?.debugAll ?? false);
//             if (Array.isArray(_tokenizer)) {
//                 _tokenizer = lexicon.lexer(_tokenizer);
//             }
//             if (Array.isArray(_grammar)) {
//                 _grammar = grammar.parser(_grammar);
//             }
//             this.tokenizer = _tokenizer as lexicon.Lexer;
//             this.grammar = _grammar as grammar.GrammarParser;
//         }
//
//         parse(raw: string): Node {
//             const self = this;
//
//             type ExpectedSymbolContext = {
//                 rule: grammar.ParsingRule,
//                 symbol: grammar.Symbol,
//                 readonly originSymbol: grammar.Symbol,
//                 node: Node
//             }
//
//             enum AcceptanceChoice {
//                 UNKNOWN,
//                 ACCEPT,
//                 DISCARD
//             }
//
//             function _cloneSymbol(symbol: grammar.Symbol) {
//                 if (grammar.isSymbolReference(symbol)) {
//                     return Object.assign({}, symbol);
//                 } else {
//                     return Object.assign({}, symbol, {symbols: (symbol as grammar.Group).symbols.slice()})
//                 }
//             }
//
//             function* _terminalSymbols(rule: grammar.ParsingRule): Generator<ExpectedSymbolContext> {
//                 /*
//                  * this function starts from a rule and return a sequence of terminal symbols
//                  * terminal symbols can be accepted
//                  */
//                 let ctx: ExpectedSymbolContext = {
//                     rule: rule,
//                     node: {
//                         name: rule.from,
//                         children: []
//                     },
//                     originSymbol: rule.to,
//                     symbol: _cloneSymbol(rule.to)
//                 }
//                 let contexts: ExpectedSymbolContext[] = [];
//
//                 function isTerminalSymbol(s: grammar.Symbol): boolean {
//                     return grammar.isSymbolReference(s) && !self.grammar.grammar.has((s as grammar.Reference).name)
//                 }
//
//                 yield ctx;
//
//                 let choice: AcceptanceChoice = AcceptanceChoice.UNKNOWN;
//
//                 // main loop
//                 VISIT_MAIN_LOOP: while (true) {
//                     // from the current context
//                     // we go down until we have a terminal context
//                     VISIT_GO_DOWN: while (!isTerminalSymbol(ctx.symbol)) {
//                         if (grammar.isSymbolReference(ctx.symbol)) {
//                             // we have a rule reference, go down a level
//                             const symbolRef = ctx.symbol as grammar.Reference;
//                             const newRule = self.grammar.grammar.get(symbolRef.name)
//                             if (!newRule) {
//                                 throw new Error(`Rule not found: ${symbolRef.name}`);
//                             }
//                             contexts.push(ctx);
//                             ctx = {
//                                 rule: newRule,
//                                 node: {
//                                     name: rule.from,
//                                     children: []
//                                 },
//                                 originSymbol: rule.to,
//                                 symbol: _cloneSymbol(rule.to)
//                             }
//
//                         } else if (grammar.isSymbolGroup(ctx.symbol)) {
//                             // we have a symbol group,
//                             // consume the group symbols in order
//                             let symbolGroup = ctx.symbol as grammar.Group;
//                             contexts.push(ctx);
//                             ctx = {
//                                 rule: ctx.rule,
//                                 node: {
//                                     name: rule.from,
//                                     children: []
//                                 },
//                                 originSymbol: null,
//                                 symbol: symbolGroup.symbols.pop()
//                             }
//
//                         } else {
//                             throw new Error(`Unknown symbol type`)
//                         }
//                     } // LOOP VISIT_GO_DOWN
//
//                     choice = ((yield ctx) as AcceptanceChoice) ?? AcceptanceChoice.DISCARD;
//
//                     if (choice === AcceptanceChoice.DISCARD &&
//                         (ctx.symbol.modifier === "?" || ctx.symbol.modifier === "*")) {
//                         choice = AcceptanceChoice.ACCEPT
//                     }
//
//                     if (choice === AcceptanceChoice.DISCARD) {
//                         DISCARD_GO_UP: while (true) {
//                             ctx = contexts.pop();
//                             if (!ctx) {
//                                 return;
//                             }
//                             let group = ctx.symbol as grammar.Group;
//                             if (group.operator === "and") {
//                                 // shortcut the AND, avoid to visit other symbols
//                                 // go up one level
//                                 continue DISCARD_GO_UP
//                             }
//                             if (group.operator === "or" && group.symbols.length === 0) {
//                                 // if an OR group is completed, no match at all
//                                 // go up
//                                 continue DISCARD_GO_UP;
//                             }
//                             // other cases: just go up by one
//                             break;
//                         }
//                     }
//
//                     if (choice === AcceptanceChoice.ACCEPT) {
//                         // current terminal is ok
//                         // go up until we need to resolve a ctx to go forward
//                         // we ALWAYS have groups above terminal symbols
//                         if (ctx.symbol.modifier === "+") {
//                             ctx.symbol.modifier = "*";
//                             break;
//                         }
//                         if (ctx.symbol.modifier === "*") {
//                             break;
//                         }
//                         ACCEPT_GO_UP: while (true) {
//                             ctx = contexts.pop();
//                             if (!ctx) {
//                                 return;
//                             }
//                             let group = ctx.symbol as grammar.Group;
//                             if (group.operator === "or") {
//                                 // shortcut the OR, avoid to visit other symbols
//                                 if (group.modifier === "+" || group.modifier === "*") {
//                                     // if the or group is required multiple times
//                                     // just reset it in the context to the initial state
//                                     ctx.symbol = _cloneSymbol(ctx.originSymbol);
//                                     ctx.symbol.modifier = "*";
//                                     break;
//                                 }
//                                 // otherwise continue and go up one level
//                                 continue ACCEPT_GO_UP;
//                             }
//                             if (group.operator === "and" && group.symbols.length === 0) {
//                                 // if an and group is completed
//                                 if (group.modifier === "+" || group.modifier === "*") {
//                                     // if the and group is required multiple times
//                                     // just reset it in the context to the initial state
//                                     ctx.symbol = _cloneSymbol(ctx.originSymbol);
//                                     ctx.symbol.modifier = "*";
//                                     break;
//                                 }
//                                 // go up only if no more symbols are available
//                                 continue ACCEPT_GO_UP;
//                             }
//                             // other cases: just go up by one
//                             break;
//                         }
//                     } // end if accept
//                 } // end VISIT_MAIN_LOOP
//             }
//
//             {
//
//                 if (isMatch) {
//                     termsToParse.next(); // remove matching symbol
//                     ctx = terminalSymbols.next(AcceptanceChoice.ACCEPT);
//                 }
//             }
//         }
//
//     .
//
//         if(
//             .
//
//                 warn
//
//     (
//
//     `Parsing stops: \n$ {
//         JSON
//     .
//
//         stringify(trace_info,
//
//         null
//     ,
//         2
//     )
//     }
//
//  \nNon-parsed terms:\n $
//     {
//         nextTerms
//     }
//     `)
//
//     }
//
//     return rootContext.value?.node;
// }
//
// }
//
// parser(_tokenizer
// :
// lexicon.Lexer | lexicon.Lexicon,
//     _grammar
// :
// grammar.GrammarParser | grammar.Grammar,
//     options
// :
// ParserOptions = undefined
// )
// {
//     return new Parser(_tokenizer, _grammar, options);
// }
//
// identity(ctx
// :
// NodeFactoryContext
// ):
// Node | Node[]
// {
//     return ctx.node;
// }
//
// mergeUp(ctx
// :
// NodeFactoryContext
// ):
// Node | Node[]
// {
//     return ctx.node.children;
// }
//
// ignore(ctx
// :
// NodeFactoryContext
// ):
// Node | Node[]
// {
//     return null;
// }
//
// }
// }