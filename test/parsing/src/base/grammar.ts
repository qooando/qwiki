import {ast} from "./ast.js"

export namespace grammar {

    export interface Reference {
        name: string;
        modifier?: "?" | "+" | "*";
    }

    export interface Group {
        symbols: Symbol[];
        operator: "or" | "and";
        modifier?: "?" | "+" | "*";
    }

    export type Symbol = Reference | Group;

    export interface ParsingRule {
        from: string
        to: Symbol
        nodeFactory: ast.NodeFactoryFun
    }

    export let isParsingRule = (x: any) => x && "from" in x && "to" in x && "nodeFactory" in x;
    export let isArrayOfParsingRule = (x: any) => x && Array.isArray(x) && isParsingRule(x[0]);

    export type ParsingRuleAsTuple = ([string, string] | [string, string, ast.NodeFactoryFun] | [string, string, ast.NodeFactoryFun]);
    export let isParsingRuleAsTuple = (x: any) => x && Array.isArray(x) && x.length >= 2 && x.length <= 3;
    export let isArrayOfPArsingRuleAsTuple = (x: any) => x && Array.isArray(x) && isParsingRuleAsTuple(x[0]);

    export type Grammar = ParsingRule[] | ParsingRuleAsTuple[] | string[][];

    export class GrammarParser {
        grammar: Map<string, ParsingRule>;
        startRule: ParsingRule;

        constructor(rules: Grammar) {
            if (isArrayOfParsingRule(rules)) {
                this.grammar = new Map((rules as ParsingRule[]).map(r => [r.from, r]));
            } else {
                this.grammar = new Map(_makeParsingRules(rules as ParsingRuleAsTuple[]).map(r => [r.from, r]));
            }
            this.startRule = this.grammar.get("__START__") ?? rules[0] as ParsingRule;
        }

        toString(): string {
            let _symbolToString = (node: Symbol): string => {
                if ((node as any).name) {
                    return (node as Reference).name + (node.modifier ?? "");
                } else {
                    let x = node as Group
                    let sep = (x.operator == "or") ? " | " : " "; // missing OR
                    return (x.symbols.length === 1 ? "" : "( ") +
                        x.symbols.map((y: Symbol) => _symbolToString(y)).join(sep) +
                        (x.symbols.length === 1 ? "" : " )") +
                        (node.modifier ?? "");
                }
            }
            let _ruleToString = (rule: ParsingRule) => {
                return rule.from + " ::= " + _symbolToString(rule.to);
            }
            return [...this.grammar.values()].map(x => _ruleToString(x)).join("\n");
        }
    }

    export function parser(rules: Grammar) {
        return new GrammarParser(rules);
    }

    export let grammarParser = parser;
    export let syntaxAnalyzer = parser;

    function _makeParsingRules(rules: ParsingRuleAsTuple[]): ParsingRule[] {
        return rules.map(rule => _makeParsingRule(rule[0], rule[1], rule[2]));
    }

    function _makeParsingRule(from: string, to: string | string[], nodeFactory: ast.NodeFactoryFun = null): ParsingRule {
        const _parse = (tokens: string | string[]): Symbol => {
            if (!Array.isArray(tokens)) {
                tokens = tokens.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x));
            }
            let and: Group = {
                symbols: [],
                operator: "and"
            }
            const or: Group = {
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
                        and.symbols.push({name: token} as Reference)
                        break;
                }
            }
            // skip symbol groups if they contains only one element and no modifier
            // skip or if it has only a child
            let result: Symbol = or;
            while ((result as any).symbols && (result as Group).symbols.length === 1 && !result.modifier) {
                result = (result as Group).symbols[0];
            }
            return result;
        };

        return {from: from, to: _parse(to), nodeFactory: nodeFactory};
    }

}