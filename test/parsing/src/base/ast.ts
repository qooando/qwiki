import {lexer} from "./lexicon.js";
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
        rule?: grammar.Rule
        ast?: Node
    }

    // export type NodeFactoryFun = (ctx: NodeFactoryContext) => Node;

    export class Parser {
        log = console
        tokenizer: lexer.Lexer;
        grammar: grammar.Grammar;
        debug = false;

        constructor(tokenizer: lexer.Lexer, grammar: grammar.Grammar) {
            this.tokenizer = tokenizer;
            this.grammar = grammar;
        }

        parse(raw: string): Node {
            let tokensToParse: iterators.BufferedIterator<lexer.Term> = iterators.buffered(this.tokenizer.tokenize(raw));

            let rootNode: Node = null;
            let isValidMatch = false;
            let nextToken = tokensToParse.nextValue();
            let nextTraceId = 0;

            const _makeEmptyNode = (rule: grammar.Rule): Node => {
                return {
                    name: rule.from,
                    children: [],
                    content: undefined,
                }
            }

            const _makeLeaf = (token: lexer.Term): Node => {
                return {
                    name: token.name,
                    children: [],
                    content: token.content,
                }
            }

            type Context = {
                node: Node,
                traceId: number,
                symbols: grammar.Symbol[],
                operator: "or" | "and",
                modifier: "?" | "*" | "+",
            }

            const _makeNewContext = (rule: grammar.Rule): Context => {
                return {
                    node: _makeEmptyNode(rule),
                    traceId: ++nextTraceId,
                    symbols: [rule.to],
                    operator: "and",
                    modifier: undefined
                }
            }

            const _symbolToString = (symbol: grammar.Symbol): string => {
                if (!symbol) {
                    return "NoSymbol"
                }
                if ((symbol as any).name) {
                    let ref = symbol as grammar.Reference;
                    return `${ref.name}${ref.modifier ?? ""}`
                } else {
                    let group = symbol as grammar.Group
                    let separator = group.operator === "or" ? "|" : " "
                    return `(${group.symbols.map(_symbolToString).join(separator)})${group.modifier ?? ""}`
                }
            }

            let parents: Context[] = [];
            let current: Context = _makeNewContext(this.grammar.rules.get("__START__"));

            const _closeCurrentContext = () => {

                /*
                 * no more symbols at this level
                 * isValidMatch has a value true|false, propagate to upper level
                 */
                const parent = parents.pop();
                if (!parent) {
                    // end
                    rootNode = isValidMatch ? current.node : null;
                    current = null;
                    return false;
                }
                if (isValidMatch) {
                    if (parent.traceId !== current.traceId) { // add children only if parent is another node
                        parent.node.children.push(current.node);
                    }
                    switch (current.modifier) {
                        case "+":
                        case "*":
                            // leave current symbol, note, current symbol should be the child we already exit
                            break;
                        default:
                        case "?":
                            parent.symbols.shift(); // consume used child
                            break;
                    }
                } else {
                    switch (current.modifier) {
                        case "?":
                        case "*":
                            isValidMatch = true;
                            break;
                        case "+":
                            let previous = parent.node.children[parent.node.children.length - 1] as Node;
                            isValidMatch = previous && previous.name === current.node.name;
                            break;
                    }
                    parent.symbols.shift(); // consume current symbol, it is invalid
                }
                if ((isValidMatch && parent.operator === "or") ||
                    (!isValidMatch && parent.operator === "and")) {
                    // skip other symbols
                    parent.symbols = [];
                }
                current = parent;
            }

            const _expandSymbolRule = (reference: grammar.Reference) => {
                const newRule = this.grammar.rules.get(reference.name);
                parents.push(current);
                current = _makeNewContext(newRule);
                current.modifier = reference.modifier;
            }

            const _matchSymbolToToken = (reference: grammar.Reference) => {
                isValidMatch = reference.name === nextToken.name;

                if (isValidMatch) {
                    current.node.children.push(_makeLeaf(nextToken));
                    nextToken = tokensToParse.nextValue();

                    switch (reference.modifier) {
                        case "+":
                        case "*":
                            // leave current symbol
                            break;
                        default:
                        case "?":
                            current.symbols.shift(); // consume current symbol, it is used
                            break;
                    }
                } else {
                    switch (reference.modifier) {
                        case "?":
                        case "*":
                            isValidMatch = true;
                            break;
                        case "+":
                            let previous = current.node.children[current.node.children.length - 1] as Node;
                            isValidMatch = previous && previous.name === reference.name;
                            break;
                    }
                    // new symbol to parse
                    current.symbols.shift();
                }
                if ((isValidMatch && current.operator === "or") ||
                    (!isValidMatch && current.operator === "and")) {
                    // consume all symbols
                    current.symbols = [];
                }
            }

            const _expandSymbolGroup = (group: grammar.Group) => {
                parents.push(current);
                current = {
                    traceId: current.traceId,
                    node: current.node,
                    symbols: group.symbols.slice(),
                    operator: group.operator,
                    modifier: group.modifier
                }
            }

            while (current) {
                /*
                 * current context describes the current rule and the symbols we are parsing
                 * we visit all symbols and resolve them.
                 * for every group or rule we go down a level,
                 * if there is no more symbols for this rule, go up one level,
                 */
                const
                    symbol: grammar.Symbol = current.symbols[0];
                if (this.debug) {
                    this.log.debug(`${" ".repeat(parents.length)} `
                        + ` [${current.node.name} ${current.traceId}]`
                        + ` previousMatch=${isValidMatch}`
                        + ` token=${nextToken ? nextToken.name : "NoToken"}`
                        + ` symbol=${_symbolToString(symbol)}`
                        + ` operator=${current.operator}`
                        + ` symbols=${current.symbols.map(_symbolToString).join(",")}`
                        + ` modifier=${current.modifier}`
                    );
                }
                if (current.symbols.length === 0 || !nextToken) {
                    _closeCurrentContext();
                    continue;
                }
                const isSymbolRef = !!(symbol as any).name;
                if (isSymbolRef) {
                    const reference = symbol as grammar.Reference;
                    if (this.grammar.rules.has(reference.name)) {
                        _expandSymbolRule(reference);
                    } else {
                        _matchSymbolToToken(reference);
                    }
                } else {
                    _expandSymbolGroup(symbol as grammar.Group)
                }
            }
            if (!isValidMatch) {
                this.log.warn(`Parse failed`);
            }
            if (nextToken) {
                this.log.warn(`Parsing stops at token: ${nextToken.name}`);
            }
            return rootNode;
        }

    }

    export function parser(_tokenizer: lexer.Lexer | lexer.TermDefinition[],
                           _grammar: grammar.Grammar | string[][] | grammar.Rule[] | grammar.StringRule[]) {
        if (Array.isArray(_tokenizer)) {
            _tokenizer = lexer.lexer(_tokenizer);
        }
        if (Array.isArray(_grammar)) {
            _grammar = grammar.grammar(_grammar);
        }
        return new Parser(_tokenizer as lexer.Lexer, _grammar as grammar.Grammar);
    }

}