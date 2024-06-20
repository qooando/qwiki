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

        export function toRules(rules: ([string, string] | [string, string, NodeFactoryFun])[]): Rule[] {
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
            startRule: Rule;
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
            return _ruleToString(grammar.startRule) + "\n"
                + grammar.rules.map(x => _ruleToString(x)).join("\n");
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

        parse(raw: string): AST {
            let tokensToParse: iterators.BufferedIterator<tokenizer.Token> = iterators.buffered(this.tokenizer.tokenize(raw));

            let rootNode: AST = null;
            let isValidMatch = false;
            let nextToken = tokensToParse.nextValue();

            const _makeEmptyNode = (rule: grammar.Rule): AstNode => {
                return {
                    name: rule.from,
                    children: [],
                    content: null,
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
                symbols: grammar.Symbol[],
                operator: "or" | "and",
                modifier: "?" | "*" | "+",
            }

            const _makeNewContext = (rule: grammar.Rule): Context => {
                return {
                    node: _makeEmptyNode(rule),
                    symbols: [rule.to],
                    operator: "and",
                    modifier: null
                }
            }

            let parents: Context[] = [];
            let current: Context = _makeNewContext(this.grammar.startRule);

            while (current) {
                /*
                 * current context describes the current rule and the symbols we are parsing
                 * we visit all symbols and resolve them.
                 * for every group or rule we go down a level,
                 * if there is no more symbols for this rule, go up one level,
                 */
                const symbol: grammar.Symbol = current.symbols[0];
                const resolveCurrent = current.symbols.length === 0;

                if (resolveCurrent) {
                    /*
                     * no more symbols at this level
                     * isValidMatch has a value true|false, propagate to upper level
                     */
                    const childNode = current.node;
                    current = parents.pop();
                    if (isValidMatch) {
                        current.node.children.push(childNode);
                        switch (current.modifier) {
                            case "+":
                            case "*":
                                // leave current symbol, note, current symbol should be the child we already exit
                                break;
                            default:
                            case "?":
                                current.symbols.shift(); // consume used child
                                break;
                        }
                    } else {
                        switch (current.modifier) {
                            case "?":
                            case "*":
                                isValidMatch = true;
                                break;
                            case "+":
                                let previous = current.node.children[current.node.children.length - 1] as AstNode;
                                isValidMatch = previous && previous.name === nextToken.name;
                                break;
                        }
                        current.symbols.shift(); // consume current symbol, it is invalid
                    }
                    if ((isValidMatch && current.operator === "or") ||
                        (!isValidMatch && current.operator === "and")) {
                        // skip other symbols
                        current.symbols = [];
                        continue;
                    }
                    continue;
                }

                const isSymbolRef = (symbol as any).name;
                const isSymbolGroup = !isSymbolRef;

                if (isSymbolRef) {
                    let reference = symbol as grammar.SymbolRef;

                    let newRule = this.grammar.rulesByFrom.get(reference.name);

                    if (newRule) {
                        // a new rule, go down one level
                        parents.push(current);
                        current.symbols.shift(); // remove current symbol from front
                        current = _makeNewContext(newRule);
                        continue;
                    } else {
                        // a terminal symbol,
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
                                    isValidMatch = previous && previous.name === nextToken.name;
                                    break;
                            }
                            // new symbol to parse
                            current.symbols.shift();
                            continue
                        }
                        if ((isValidMatch && current.operator === "or") ||
                            (!isValidMatch && current.operator === "and")) {
                            // consume all symbols
                            current.symbols = [];
                            continue;
                        }
                        continue;
                    }
                    throw new Error(`Not reachable`);
                }

                if (isSymbolGroup) {
                    // it's a group, go down a level
                    const group = symbol as grammar.SymbolGroup;
                    parents.push(current);
                    current = {
                        node: current.node,
                        symbols: group.symbols,
                        operator: group.operator,
                        modifier: group.modifier
                    }
                    continue;
                }

                throw new Error(`Not reachable`);
            }

            if (!isValidMatch) {
                this.log.warn(`Invalid parse`);
            }

            if (nextToken != null) {
                this.log.warn(`Parsing stops at token: ${nextToken.name}`);
            }

            return rootNode;
        }

    }

    export function parser(tokenizer: tokenizer.GenericTokenizer, grammar: grammar.Grammar) {
        return new GenericParser(tokenizer, grammar);
    }
}