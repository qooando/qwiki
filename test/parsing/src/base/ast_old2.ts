// import {lexicon} from "./lexicon.js";
// import {grammar} from "./grammar.js";
// import {iterators} from "./iterators.js";
//
// export namespace ast {
//
//     export interface Node {
//         name?: string
//         children: Node[]
//         content: any
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
//             let tokensToParse: iterators.BufferedIterator<lexicon.Term> = iterators.buffered(this.tokenizer.tokenize(raw));
//             tokensToParse.mark(); // we call nextValue just below, mark tokensToParse to be sure we can call reset if no match was found
//
//             let rootNode: Node = null;
//             let isValidMatch = false;
//             let nextToken: lexicon.Term = tokensToParse.peekValue();
//             let nextTraceId = 0;
//             let trace: any = {
//                 failsStack: [],
//                 lastFail: null
//             } // trace for debugging
//
//             const _resetTraceOnMatch = () => {
//                 trace.failsStack = [];
//                 if (trace.lastFail) {
//                     trace.lastFail.beforeAValidMatch = true;
//                 }
//             }
//
//             const _addTraceOnFailedMatch = () => {
//                 let lastFail = Object.assign({
//                     nextToken: nextToken,
//                     nextTokenIndex: tokensToParse.cursor,
//                     beforeAValidMatch: false
//                 }, current);
//                 if (trace.lastFail?.beforeAValidMatch ?? true) {
//                     trace.lastFail = lastFail;
//                 }
//                 trace.failsStack.push(lastFail);
//             }
//
//             const _addToTrace = () => {
//
//             }
//
//             const _makeEmptyNode = (rule: grammar.ParsingRule): Node => {
//                 return {
//                     name: rule.from,
//                     children: [],
//                     content: undefined,
//                 }
//             }
//
//             const _makeLeaf = (token: lexicon.Term): Node => {
//                 return {
//                     name: token.term,
//                     children: [],
//                     content: token.content,
//                 }
//             }
//
//             type Context = {
//                 node: Node,
//                 traceId: number,
//                 symbols: grammar.Symbol[],
//                 operator: "or" | "and",
//                 modifier: "?" | "*" | "+",
//                 nodeFactory: NodeFactoryFun
//             }
//
//             const _makeNewContext = (rule: grammar.ParsingRule): Context => {
//                 return {
//                     node: _makeEmptyNode(rule),
//                     traceId: ++nextTraceId,
//                     symbols: [rule.to],
//                     operator: "and",
//                     modifier: undefined,
//                     nodeFactory: rule.nodeFactory
//                 }
//             }
//
//             const _symbolToString = (symbol: grammar.Symbol): string => {
//                 if (!symbol) {
//                     return "NoSymbol"
//                 }
//                 if ((symbol as any).name) {
//                     let ref = symbol as grammar.Reference;
//                     return `${ref.name}${ref.modifier ?? ""}`
//                 } else {
//                     let group = symbol as grammar.Group
//                     let separator = group.operator === "or" ? "|" : " "
//                     return `(${group.symbols.map(_symbolToString).join(separator)})${group.modifier ?? ""}`
//                 }
//             }
//
//             let parents: Context[] = [];
//             let current: Context = _makeNewContext(this.grammar.startRule);
//
//             const _closeCurrentContext = () => {
//                 /*
//                  * no more symbols at this level
//                  * isValidMatch has a value true|false, propagate to upper level
//                  */
//                 const parent = parents.pop();
//                 if (!parent) {
//                     // end
//                     rootNode = isValidMatch ? current.node : null;
//                     current = null;
//                     return false;
//                 }
//                 let changeRule = parent.traceId !== current.traceId;
//                 if (isValidMatch) {
//                     if (changeRule) { // add children only if parent is another node
//                         const actualNode = !!current.nodeFactory ? current.nodeFactory(current) : current.node;
//                         if (actualNode) {
//                             if (Array.isArray(actualNode)) {
//                                 parent.node.children.push(...actualNode);
//                             } else {
//                                 parent.node.children.push(actualNode);
//                             }
//                         }
//                         // parent.node.children.push(current.node);
//                         // add node to stack trace
//                     }
//                     switch (current.modifier) {
//                         case "+":
//                         case "*":
//                             // leave current symbol, note, current symbol should be the child we already exit
//                             break;
//                         default:
//                         case "?":
//                             parent.symbols.shift(); // consume used child
//                             break;
//                     }
//                 } else {
//                     switch (current.modifier) {
//                         case "?":
//                         case "*":
//                             isValidMatch = true;
//                             break;
//                         case "+":
//                             let previous = parent.node.children[parent.node.children.length - 1] as Node;
//                             isValidMatch = previous && previous.name === current.node.name;
//                             break;
//                     }
//                     parent.symbols.shift(); // consume current symbol, it is invalid
//                 }
//                 if ((isValidMatch && parent.operator === "or") ||
//                     (!isValidMatch && parent.operator === "and")) {
//                     // skip other symbols
//                     parent.symbols = [];
//                 }
//                 if (this.debug && changeRule) {
//                     // this.log.debug(" ".repeat(parents.length)
//                     //     + `/${current.node.name} (${current.traceId})`
//                     //     + " " + (isValidMatch ? "✓" : "⨉")
//                     // );
//                     // this.log.debug(`${" ".repeat(parents.length)}`
//                     //     + ` [/${current.node.name} ${current.traceId}]`
//                     //     + ` ${isValidMatch ? "✓" : "⨉"}`
//                     // );
//                 }
//                 //
//                 // if (this.debug) {
//                 //     this.log.debug(`${" ".repeat(parents.length)} `
//                 //         + ` ${isValidMatch ? "✓" : "⨉"}`
//                 //         + ` [${current.node.name} ${current.traceId}]`
//                 //         + ` rule=${current.symbols.map(_symbolToString).join(" ")} token=${nextToken.term}`
//                 //     );
//                 // }
//
//                 if (isValidMatch) {
//                     _resetTraceOnMatch();
//                     tokensToParse.unmark();
//                 } else {
//                     _addTraceOnFailedMatch();
//                     tokensToParse.reset();
//                     nextToken = tokensToParse.peekValue();
//
//                     // if (this.debugAll) {
//                     //     this.log.debug(`${" ".repeat(parents.length)} `
//                     //         + ` ${isValidMatch ? "✓" : "⨉"}`
//                     //         + ` [${current.node.name} ${current.traceId}]`
//                     //         + ` reset tokens buffer to ${nextToken.term}`
//                     //     );
//                     // }
//                 }
//                 current = parent;
//             }
//
//             const _expandSymbolRule = (reference: grammar.Reference) => {
//                 const newRule = this.grammar.grammar.get(reference.name);
//                 parents.push(current);
//                 tokensToParse.mark();
//                 current = _makeNewContext(newRule);
//                 current.modifier = reference.modifier;
//
//                 // if (this.debug) {
//                 //     this.log.debug(" ".repeat(parents.length)
//                 //         + `${current.node.name} (${current.traceId})`
//                 //         // + ` ${current.symbols.map(_symbolToString).join(" ")} ?= ${nextToken.term}`
//                 //     );
//                 // }
//             }
//
//             const _matchSymbolToToken = (reference: grammar.Reference) => {
//                 let prevToken = nextToken;
//                 isValidMatch = reference.name === nextToken.term;
//
//                 if (isValidMatch) {
//                     current.node.children.push(_makeLeaf(nextToken));
//                     tokensToParse.nextValue(); // pop current peek value
//                     nextToken = tokensToParse.peekValue(); // get the actual next token
//
//                     switch (reference.modifier) {
//                         case "+":
//                         case "*":
//                             // leave current symbol
//                             break;
//                         default:
//                         case "?":
//                             current.symbols.shift(); // consume current symbol, it is used
//                             break;
//                     }
//                 } else {
//                     switch (reference.modifier) {
//                         case "?":
//                         case "*":
//                             isValidMatch = true;
//                             break;
//                         case "+":
//                             let previous = current.node.children[current.node.children.length - 1] as Node;
//                             isValidMatch = previous && previous.name === reference.name;
//                             break;
//                     }
//                     // new symbol to parse
//                     current.symbols.shift();
//                 }
//                 if ((isValidMatch && current.operator === "or") ||
//                     (!isValidMatch && current.operator === "and")) {
//                     // consume all symbols
//                     current.symbols = [];
//                 }
//
//                 if (this.debug) {
//                     if (isValidMatch) {
//                         // this.log.debug(" ".repeat(parents.length)
//                         //     + (isValidMatch ? "✓" : "⨉")
//                         //     + prevToken.term
//                         // );
//                         this.log.debug(
//                             ""
//                             + prevToken.term.padEnd(20)
//                             + " "
//                             + current.traceId.toString().padStart(8)
//                             + " "
//                             + parents.map(x => x.node)
//                                 .filter((value, index, array) => array.indexOf(value) === index)
//                                 .map(x => x.name)
//                                 .join(".")
//                         )
//                     }
//                     // this.log.debug(`${" ".repeat(parents.length)}`
//                     //     + `${isValidMatch ? "✓" : "⨉"}`
//                     //     // + ` [${current.node.name} ${current.traceId}]`
//                     //     + ` ${reference.name}${reference.modifier ?? ""} ?= ${prevToken.term}`
//                     // );
//                 }
//
//             }
//
//             const _expandSymbolGroup = (group: grammar.Group) => {
//                 tokensToParse.mark();
//                 parents.push(current);
//                 current = {
//                     traceId: current.traceId,
//                     node: current.node,
//                     symbols: group.symbols.slice(),
//                     operator: group.operator,
//                     modifier: group.modifier,
//                     nodeFactory: null
//                 }
//             }
//
//             // if (this.debug) {
//             //     this.log.debug(" ".repeat(parents.length)
//             //         + `${current.node.name} (${current.traceId})`
//             //         // + ` ${current.symbols.map(_symbolToString).join(" ")} ?= ${nextToken.term}`
//             //     );
//             //     // this.log.debug(`${" ".repeat(parents.length)}`
//             //     //     + `[${current.node.name} ${current.traceId}]`
//             //     //     + ` ${current.symbols.map(_symbolToString).join(" ")} ?= ${nextToken.term}`
//             //     // );
//             // }
//
//             while (current) {
//                 /*
//                  * current context describes the current rule and the symbols we are parsing
//                  * we visit all symbols and resolve them.
//                  * for every group or rule we go down a level, and mark the current tokens buffer
//                  * if there is no more symbols for this rule, go up one level,
//                  *      if a match is valid, just unmark the tokens buffer
//                  *      if a match is invalid, reset the tokens buffer
//                  */
//                 const symbol: grammar.Symbol = current.symbols[0];
//                 // if (this.debugAll && symbol) {
//                 //     this.log.debug(`${" ".repeat(parents.length)} `
//                 //         + ` ${isValidMatch ? "✓" : "⨉"}`
//                 //         + ` [${current.node.name} ${current.traceId}]`
//                 //         + ` ${nextToken ? nextToken.term : "NoToken"}`
//                 //         + ` =? ${current.symbols.map(_symbolToString).join(",")}`
//                 //         // + ` symbol=${_symbolToString(symbol)}`
//                 //         // + ` ${current.operator ?? ""}`
//                 //         // + ` ${current.modifier ?? ""}`
//                 //         // + ` previousMatch=${isValidMatch}`
//                 //     );
//                 // }
//                 if (current.symbols.length === 0 || !nextToken) {
//                     _closeCurrentContext();
//                     continue;
//                 }
//                 const isSymbolRef = !!(symbol as any).name;
//                 if (isSymbolRef) {
//                     const reference = symbol as grammar.Reference;
//                     if (this.grammar.grammar.has(reference.name)) {
//                         _addToTrace();
//                         _expandSymbolRule(reference);
//                     } else {
//                         _matchSymbolToToken(reference);
//                     }
//                 } else {
//                     _addToTrace()
//                     _expandSymbolGroup(symbol as grammar.Group)
//                 }
//             }
//             if (!isValidMatch) {
//                 this.log.warn(`Parse failed`);
//             }
//             if (nextToken) {
//                 let nextTokens = [...tokensToParse].slice(0, 6).map(x => JSON.stringify(x)).join("\n ");
//                 // this.log.warn(`Parsing stops while populating node: ${trace.nodes?.[trace.nodes.length - 1]?.name} \n ${nextTokens}`);
//
//                 let trace_info = {
//                     node: trace.lastFail?.node?.name,
//                     traceId: trace.lastFail?.traceId,
//                     nextToken: trace.lastFail?.nextToken?.term,
//                     nextTokenIndex: trace.lastFail?.nextTokenIndex
//                 }
//                 this.log.warn(`Parsing stops: \n${JSON.stringify(trace_info, null, 2)} \nNot parsed tokens:\n ${nextTokens}`)
//             }
//             return rootNode;
//         }
//
//     }
//
//     export function parser(_tokenizer: lexicon.Lexer | lexicon.Lexicon,
//                            _grammar: grammar.GrammarParser | grammar.Grammar,
//                            options: ParserOptions = undefined) {
//         return new Parser(_tokenizer, _grammar, options);
//     }
//
//     export namespace nodeFactory {
//
//         export function identity(ctx: NodeFactoryContext): Node | Node[] {
//             return ctx.node;
//         }
//
//         export function mergeUp(ctx: NodeFactoryContext): Node | Node[] {
//             return ctx.node.children;
//         }
//
//         export function ignore(ctx: NodeFactoryContext): Node | Node[] {
//             return null;
//         }
//
//     }
// }