import {tokenizer} from "./tokenizer.js"
import {iterators} from "./iterators.js";

export namespace parser {

    import NonTerminal = parser.grammar.NonTerminal;
    export namespace grammar {
        /*
         START = FOO | BAR
         FOO = a b+ c
         BAR = d ( FOO e )+
         */

        // match a single token
        export interface Terminal {
            label: string;
            modifier?: "?" | "+" | "*";
            factory?: NodeFactoryFun;
        }

        // match a group
        export interface NonTerminal {
            label?: string;
            group?: Symbol[];
            operator?: "or" | "and";
            modifier?: "?" | "+" | "*";
            factory?: NodeFactoryFun;
        }

        export type Symbol = Terminal | NonTerminal

        export function toRule(label: string, group: string, factory: NodeFactoryFun = undefined) {
            return strArrayToRule(label, group.split(/[ ()*+?|]/), factory);
        }

        export function toRules(input: ([string, string] | [string, string, NodeFactoryFun])[]) {
            return input.map(x => {
                return strArrayToRule(x[0], x[1].split(/[ ()*+?|]/), x[2]);
            })
        }

        export function strArrayToRule(label: string, tokens: string[], factory?: NodeFactoryFun): Symbol {

            let orRule: Symbol = {
                label: label,
                group: new Array<Symbol>(),
                operator: "or",
                factory: factory
            }

            let andRule: Symbol = {
                group: [],
                operator: "and"
            }
            orRule.group.push(andRule)

            while (tokens.length) {
                let token = tokens.shift();
                switch (token) {
                    case "(":
                        let nestingLevel = 1;
                        let group = []
                        while (nestingLevel > 0 && tokens.length) {
                            token = tokens.shift();
                            if (token === "(") {
                                nestingLevel++;
                            } else if (token === ")") {
                                nestingLevel--;
                                if (nestingLevel > 0) {
                                    group.push(token);
                                }
                            } else {
                                group.push(token);
                            }
                        }
                        andRule.group.push(strArrayToRule(null, group));
                        break;
                    case "|":
                        andRule = {
                            group: [],
                            operator: "and"
                        };
                        orRule.group.push(andRule)
                        break;
                    case "+":
                    case "?":
                    case "*":
                        andRule.group[andRule.group.length - 1].modifier = token;
                        break;
                    default:
                        andRule.group.push({
                            label: token
                        });
                        break;
                }
            }

            let result = orRule;

            // simplify if group is not actually required
            while (result.group && result.group.length === 1 && !result.modifier) {
                result.group[0].factory = result.factory
                result = result.group[0];
            }

            return result;
        }

        export function strToRule(label: string, ruleStr: string): Symbol {
            return strArrayToRule(label, ruleStr.split(/[ ()*+?|]/))
        }

        export interface Grammar {
            startSymbol: Symbol;
            symbols: Symbol[];
            symbolsByLabel?: Map<string, Symbol>;
        }
    }

    export interface Node {
        label: string
        children: Node[]

        [x: string]: any
    }

    export interface NodeFactoryContext {
        symbol?: grammar.Symbol
        group?: Node[]
    }

    export type NodeFactoryFun = (ctx: NodeFactoryContext) => Node;

    export type ParseResult = Node | "NoMatch" | "EmptyMatch";

    export class GenericParser {
        log = console
        tokenizer: tokenizer.GenericTokenizer;
        grammar: grammar.Grammar;

        constructor(tokenizer: tokenizer.GenericTokenizer, grammar: grammar.Grammar) {
            this.tokenizer = tokenizer
            this.grammar = grammar;

            // initialize grammar
            grammar.symbols.forEach(symbol => {
                if (!symbol.label) {
                    throw new Error(`Symbol without label`)
                }
                this.grammar.symbolsByLabel.set(symbol.label, symbol);
            })
        }

        parse(raw: string): ParseResult {
            let tokens = iterators.buffered(this.tokenizer.tokenize(raw));

            let _defaultNodeFactoryFun = (ctx: NodeFactoryContext): Node => {
                return {
                    label: null,
                    children: ctx.group
                }
            };

            let _visitSymbol = (symbol: grammar.Symbol): ParseResult => {
                if (symbol.modifier) {
                    let noModSymbol: grammar.Symbol = Object.assign({}, symbol, {modifier: null});
                    switch (symbol.modifier) {
                        case "?": {
                            let child = _visitSymbol(noModSymbol);
                            return child === "NoMatch" ? "EmptyMatch" : child;
                        }
                        case "+": {
                            let children: Node[] = [];
                            let child: ParseResult;
                            while ((child = _visitSymbol(noModSymbol)) !== "NoMatch") {
                                children.push(<Node>child);
                            }
                            if (!children.length) {
                                return "NoMatch";
                            }
                            return (symbol.factory ?? _defaultNodeFactoryFun)({
                                symbol: symbol,
                                group: children
                            });
                        }
                        case "*": {
                            let children: Node[] = [];
                            let child: ParseResult;
                            while ((child = _visitSymbol(noModSymbol)) !== "NoMatch") {
                                children.push(<Node>child);
                            }
                            return (symbol.factory ?? _defaultNodeFactoryFun)({
                                symbol: symbol,
                                group: children
                            });
                        }
                        default:
                            throw new Error(`Unsupported modifier: ${symbol.modifier}`);
                    }
                }

                const isTerminal = !((symbol as any).group);
                if (isTerminal) {
                    /*
                     * search for a symbol in the grammar
                     * if there is no symbol in the grammar,
                     *
                     * label SHOULD MATCH the next token
                     */
                    let nextSymbol = this.grammar.symbolsByLabel.get(symbol.label)
                    if (nextSymbol) {
                        return _visitSymbol(nextSymbol);
                    }

                    tokens.mark()
                    let token = tokens.next().value;
                    if (symbol.label === token.label) {
                        tokens.unmark();
                        return (symbol.factory ?? _defaultNodeFactoryFun)({
                            symbol: symbol
                        });
                    } else {
                        tokens.reset();
                        return "NoMatch";
                    }
                }

                let nonTerminal = symbol as NonTerminal;
                switch (nonTerminal.operator) {
                    case "and": {
                        tokens.mark()
                        let result = nonTerminal.group
                            .map(x => _visitSymbol(x))
                            .filter(x => x != "EmptyMatch");
                        if (result.includes("NoMatch")) {
                            tokens.reset();
                            return "NoMatch";
                        }
                        tokens.unmark();
                        return (symbol.factory ?? _defaultNodeFactoryFun)({
                            symbol: symbol,
                            group: result as Node[]
                        });
                    }
                    case "or": {
                        let result: ParseResult = null;
                        tokens.mark();
                        for (let subSymbol of nonTerminal.group) {
                            result = _visitSymbol(subSymbol);
                            if (result !== "NoMatch") {
                                break;
                            }
                        }
                        if (result === "NoMatch") {
                            tokens.reset();
                            return "NoMatch";
                        }
                        tokens.unmark();
                        return result;
                    }
                    default:
                        throw new Error(`Not implemented operator ${nonTerminal.operator}`);
                }
            }

            return _visitSymbol(this.grammar.startSymbol);
        }
    }

    export function parser(tokenizer: tokenizer.GenericTokenizer, grammar: grammar.Grammar) {
        return new GenericParser(tokenizer, grammar);
    }
}