import {tokenizer} from "./tokenizer.js"
import {iterators} from "./iterators.js";

export namespace parser {

    export namespace grammar {
        /*
         START = FOO | BAR
         FOO = a b+ c
         BAR = d ( FOO e )+
         */
        export interface SymbolRef {
            name: string;
            modifier?: "?" | "+" | "*";
        }

        export interface SymbolGroup {
            symbols: Symbol[];
            operator: "or" | "and";
            modifier?: "?" | "+" | "*";
        }

        export type Symbol = SymbolRef | SymbolGroup;

        export interface Rule {
            from: string
            to: Symbol
            // toNode?: NodeFactoryFun; // if rule matches, call toNode
        }

        export type InlineRule = ([string, string] | [string, string, NodeFactoryFun]);

        export function toRules(rules: InlineRule[]): Rule[] {
            return rules.map(rule => {
                return toRule(rule[0], rule[1], rule[2]);
            })
        }

        export function toRule(from: string, to: string | string[], toNode: NodeFactoryFun = undefined): Rule {
            const _parse = (tokens: string | string[]): Symbol => {
                if (!Array.isArray(tokens)) {
                    tokens = tokens.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x));
                }
                let and: SymbolGroup = {
                    symbols: [],
                    operator: "and"
                }
                const or: SymbolGroup = {
                    symbols: [and],
                    operator: "or"
                };

                while (tokens.length) {
                    let token = tokens.shift();
                    if (!token) {
                        continue
                    }
                    switch (token) {
                        case "(":
                            // if a group is present, parse it and put it in and
                            let nestingLevel = 1;
                            let childTokens = []
                            while (nestingLevel > 0 && tokens.length) {
                                token = tokens.shift();
                                if (token === "(") {
                                    nestingLevel++;
                                } else if (token === ")") {
                                    nestingLevel--;
                                    if (nestingLevel > 0) {
                                        childTokens.push(token);
                                    }
                                } else {
                                    childTokens.push(token);
                                }
                            }
                            and.symbols.push(_parse(childTokens));
                            break;
                        case "|":
                            // an or symbol means we add a new and group to the or operation
                            and = {
                                symbols: [],
                                operator: "and"
                            };
                            or.symbols.push(and)
                            break;
                        case "+":
                        case "?":
                        case "*":
                            // just get the previous symbol and add the modifier
                            and.symbols[and.symbols.length - 1].modifier = token;
                            break;
                        default:
                            // any other token, add it as symbol
                            and.symbols.push({name: token} as SymbolRef)
                            break;
                    }
                }
                // skip symbol groups if they contains only one element and no modifier
                // skip or if it has only a child
                let result: Symbol = or;
                while ((result as any).symbols && (result as SymbolGroup).symbols.length === 1 && !result.modifier) {
                    result = (result as SymbolGroup).symbols[0];
                }
                return result;
            };

            return {
                from: from,
                to: _parse(to),
                // toNode: toNode
            }
        }

        export interface Grammar {
            rules: Rule[];
            rulesByFrom?: Map<string, Rule>;
        }

        export function grammarToString(grammar: Grammar) {
            let _nodeToString = (node: Symbol): string => {
                if ((node as any).name) {
                    return (node as SymbolRef).name + (node.modifier ?? "");
                } else {
                    let x = node as SymbolGroup
                    let sep = (x.operator == "or") ? " | " : " "; // missing OR
                    return (x.symbols.length === 1 ? "" : "( ") +
                        x.symbols.map((y: Symbol) => _nodeToString(y)).join(sep) +
                        (x.symbols.length === 1 ? "" : " )") +
                        (node.modifier ?? "");
                }
            }
            let _ruleToString = (rule: Rule) => {
                return rule.from + " ::= " + _nodeToString(rule.to);
            }
            return grammar.rules.map(x => _ruleToString(x)).join("\n");
        }

    }

    export const EMPTY_AST = "EmptyAST";
    export const NO_AST = "NoAST"
    export type AST = AstNode | "EmptyAST" | "NoAST";

    export interface AstNode {
        name?: string
        children: AST[]
        content: any

        [x: string]: any
    }

    export interface NodeFactoryContext {
        rule?: grammar.Rule
        ast?: AST
    }

    export type NodeFactoryFun = (ctx: NodeFactoryContext) => AstNode;

    export class GenericParser {
        log = console
        tokenizer: tokenizer.GenericTokenizer;
        grammar: grammar.Grammar;
        debug = false;

        constructor(tokenizer: tokenizer.GenericTokenizer, grammar: grammar.Grammar) {
            this.tokenizer = tokenizer
            this.grammar = grammar;
            this.grammar.rulesByFrom ??= new Map();

            // initialize grammar
            grammar.rules.forEach((rule: grammar.Rule) => {
                if (!rule.from) {
                    throw new Error(`Invalid rule, missing 'from' field`)
                }
                this.grammar.rulesByFrom.set(rule.from, rule);
            })
        }

        static fromRules(tokenizer: tokenizer.GenericTokenizer, rules: grammar.InlineRule[]) {
            return new GenericParser(
                tokenizer,
                {
                    rules: grammar.toRules(rules)
                });
        }

        parse(raw: string): AST {
            let tokensToParse: iterators.BufferedIterator<tokenizer.Token> = iterators.buffered(this.tokenizer.tokenize(raw));

            let rootNode: AST = NO_AST;
            let isValidMatch = false;
            let nextToken = tokensToParse.nextValue();
            let nextTraceId = 0;

            const _makeEmptyNode = (rule: grammar.Rule): AstNode => {
                return {
                    name: rule.from,
                    children: [],
                    content: undefined,
                }
            }

            const _makeLeaf = (token: tokenizer.Token): AstNode => {
                return {
                    name: token.name,
                    children: [],
                    content: token.content,
                }
            }

            type Context = {
                node: AstNode,
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
                    let ref = symbol as grammar.SymbolRef;
                    return `${ref.name}${ref.modifier ?? ""}`
                } else {
                    let group = symbol as grammar.SymbolGroup
                    let separator = group.operator === "or" ? "|" : " "
                    return `(${group.symbols.map(_symbolToString).join(separator)})${group.modifier ?? ""}`
                }
            }

            let parents: Context[] = [];
            let current: Context = _makeNewContext(this.grammar.rulesByFrom.get("__START__"));

            const _closeCurrentContext = () => {

                /*
                 * no more symbols at this level
                 * isValidMatch has a value true|false, propagate to upper level
                 */
                const parent = parents.pop();
                if (!parent) {
                    // end
                    rootNode = isValidMatch ? current.node : NO_AST;
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
                            let previous = parent.node.children[parent.node.children.length - 1] as AstNode;
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

            const _expandSymbolRule = (reference: grammar.SymbolRef) => {
                const newRule = this.grammar.rulesByFrom.get(reference.name);
                parents.push(current);
                current = _makeNewContext(newRule);
                current.modifier = reference.modifier;
            }

            const _matchSymbolToToken = (reference: grammar.SymbolRef) => {
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
                            let previous = current.node.children[current.node.children.length - 1] as AstNode;
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

            const _expandSymbolGroup = (group: grammar.SymbolGroup) => {
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
                    const reference = symbol as grammar.SymbolRef;
                    if (this.grammar.rulesByFrom.has(reference.name)) {
                        _expandSymbolRule(reference);
                    } else {
                        _matchSymbolToToken(reference);
                    }
                } else {
                    _expandSymbolGroup(symbol as grammar.SymbolGroup)
                }
            }
            // if (isValidMatch) {
            //     rootNode = parents ? parents[0].node : current.node;
            // }
            if (!isValidMatch) {
                this.log.warn(`Parse failed`);
            }
            if (nextToken) {
                this.log.warn(`Parsing stops at token: ${nextToken.name}`);
            }
            return rootNode;
        }

    }

    export function parser(tokenizer: tokenizer.GenericTokenizer, grammar: grammar.Grammar) {
        return new GenericParser(tokenizer, grammar);
    }

    export function fromRules(tokenizer: tokenizer.GenericTokenizer, rules: string[][] | grammar.InlineRule[]) {
        return new GenericParser(
            tokenizer,
            {
                rules: grammar.toRules(rules as grammar.InlineRule[])
            });
    }
}