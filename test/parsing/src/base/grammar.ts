import {ast} from "./ast.js"
import {Graph, Vertex} from "./util/Graph.js";

export namespace grammar {

    import nodeFactory = ast.nodeFactory;

    export interface Node {
        name: string;
        term: string;
        children?: Node[]
        nodeFactory?: ast.NodeFactoryFun
    }

    // export interface Reference {
    //     name: string;
    //     modifier?: "?" | "+" | "*";
    // }
    //
    // export interface Group {
    //     symbols: Symbol[];
    //     operator: "or" | "and";
    //     modifier?: "?" | "+" | "*";
    // }
    //
    // export type Symbol = Reference | Group;
    // export let isSymbolGroup = (x: any) => x && "operator" in x;
    // export let isSymbolReference = (x: any) => x && "name" in x;
    // export type GrammarRule = [string,]
    //
    // export let isGrammarRule = (x: any) => x && "from" in x && "to" in x && "nodeFactory" in x;
    // export let isArrayOfParsingRule = (x: any) => x && Array.isArray(x) && isGrammarRule(x[0]);
    // export type GrammarRuleAsTuple = ([string, string] | [string, string, ast.NodeFactoryFun] | [string, string, ast.NodeFactoryFun]);
    // export let isParsingRuleAsTuple = (x: any) => x && Array.isArray(x) && x.length >= 2 && x.length <= 3;
    // export let isArrayOfParsingRuleAsTuple = (x: any) => x && Array.isArray(x) && isParsingRuleAsTuple(x[0]);
    // export type Grammar = GrammarRule[] | GrammarRuleAsTuple[] | string[][];

    export type GrammarRule = [string, string] | [string, string, ast.NodeFactoryFun];
    export type Grammar = GrammarRule[];

    export type GrammarRuleVertexData = {
        isTerminal: boolean,
        expectedTerm?: string,
        expectedVertexName?: string,
        isGroupStart?: boolean,
        isGroupEnd?: boolean,
        groupStartVertexName?: string,
        groupEndVertexName?: string,

        ruleName?: string,
        nodeFactory?: ast.NodeFactoryFun,
    }

    export class GrammarParser {
        graph: Graph;
        rawRules: Map<string, { consequents: string, nodeFactory?: ast.NodeFactoryFun }>;
        startRule: string;
        // grammar: Map<string, GrammarRule>;
        // startRule: GrammarRule;

        constructor(rules: Grammar) {
            let g = this.graph = new Graph();

            // first rule
            this.startRule = rules[0][0];
            this.rawRules = new Map(rules.map(x => [x[0], {consequents: x[1], nodeFactory: x[2]}]));

            // populate graph
            for (const [ruleName, consequents, nodeFactory] of rules) {
                // first rule is the starting rule
                const ruleStartVertexName = `${ruleName}_START`,
                    ruleEndVertexName = `${ruleName}_END`,
                    startVertexData: GrammarRuleVertexData = {
                        isTerminal: true,
                        ruleName: ruleName,
                        isGroupStart: true,
                        groupStartVertexName: ruleStartVertexName,
                        groupEndVertexName: ruleEndVertexName
                    },
                    endVertexData: GrammarRuleVertexData = {
                        isTerminal: true,
                        ruleName: ruleName,
                        nodeFactory: nodeFactory,
                        isGroupEnd: true
                    };

                g.upsertVertex(ruleStartVertexName, startVertexData);
                g.upsertVertex(ruleEndVertexName, endVertexData);

                let tokens = [
                    ruleStartVertexName,
                    ...consequents.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x)),
                    ruleEndVertexName
                ];
                let previousPreviousVertexNames: string[] = []
                let previousVertexNames: string[] = []
                let groups: GrammarRuleVertexData[] = [startVertexData];
                let lastClosedGroup: GrammarRuleVertexData = null;

                tokens.forEach((token, index) => {
                    if (!token) {
                        return;
                    }
                    let currentGroup = groups[groups.length - 1];
                    switch (token) {
                        case "(": {// group
                            const groupStartVertexName = `${ruleName}_(_${index}_START`,
                                groupEndVertexName = `${ruleName}_)_${index}_END`,
                                vertexData: GrammarRuleVertexData = {
                                    isTerminal: true,
                                    isGroupStart: true,
                                    isGroupEnd: false,
                                    groupStartVertexName: groupStartVertexName,
                                    groupEndVertexName: groupEndVertexName
                                };
                            g.upsertVertex(groupStartVertexName, vertexData);
                            previousVertexNames.forEach(n => g.upsertDirectedEdge(n, groupStartVertexName));
                            groups.push(vertexData);
                            previousPreviousVertexNames = previousVertexNames;
                            previousVertexNames = [groupStartVertexName];
                            break;
                        }
                        case ")": {
                            const group = groups.pop(),
                                groupEndVertexName = group.groupEndVertexName,
                                vertexData: GrammarRuleVertexData = {
                                    isTerminal: true,
                                    isGroupStart: false,
                                    isGroupEnd: true,
                                    groupEndVertexName: groupEndVertexName
                                };
                            lastClosedGroup = group;
                            g.upsertVertex(groupEndVertexName, vertexData);
                            previousVertexNames.forEach(n => g.upsertDirectedEdge(n, groupEndVertexName));
                            previousPreviousVertexNames = previousVertexNames;
                            previousVertexNames = [groupEndVertexName];
                            break;
                        }
                        case "|": { // or
                            // current group of symbols from ( to | or from | to | is a group
                            // we need to link it to the group end and restart the group from the beginning
                            previousVertexNames.forEach(n => g.upsertDirectedEdge(n, currentGroup.groupEndVertexName));
                            previousPreviousVertexNames = previousVertexNames;
                            previousVertexNames = [currentGroup.groupStartVertexName];
                            break;
                        }
                        case "?": {
                            // next node should connect to previous node and its antecedents
                            previousVertexNames = [...previousPreviousVertexNames, ...previousVertexNames];
                            previousPreviousVertexNames = [];
                            break;
                        }
                        case "*": {
                            // loop on itself or group
                            previousVertexNames.forEach(n => {
                                if (lastClosedGroup.groupEndVertexName === n) {
                                    g.upsertDirectedEdge(n, lastClosedGroup.groupStartVertexName);
                                } else {
                                    g.upsertDirectedEdge(n, n);
                                }
                            });
                            // next node should connect to previous node and its antecedents
                            previousVertexNames = [...previousPreviousVertexNames, ...previousVertexNames];
                            previousPreviousVertexNames = [];
                            break;
                        }
                        case "+": {
                            // loop on the group or on itself
                            previousVertexNames.forEach(n => {
                                if (lastClosedGroup.groupEndVertexName === n) {
                                    g.upsertDirectedEdge(n, lastClosedGroup.groupStartVertexName);
                                } else {
                                    g.upsertDirectedEdge(n, n);
                                }
                            });
                            break;
                        }
                        default: { // and
                            if (currentGroup.groupStartVertexName === token) {
                                previousVertexNames.forEach(n => g.upsertDirectedEdge(n, token));
                                previousPreviousVertexNames = previousVertexNames;
                                previousVertexNames = [token];
                            } else if (currentGroup.groupEndVertexName === token) {
                                previousVertexNames.forEach(n => g.upsertDirectedEdge(n, token));
                                previousPreviousVertexNames = previousVertexNames;
                                previousVertexNames = []; // end of this rule
                            } else {
                                const currentVertexName = `${ruleName}_${token}_${index}`,
                                    isTerminal = !this.rawRules.has(token),
                                    vertexData: GrammarRuleVertexData = {
                                        expectedTerm: token,
                                        expectedVertexName: isTerminal ? null : `${token}_START`,
                                        isGroupStart: token.startsWith("_START"),
                                        isGroupEnd: token.endsWith("_END"),
                                        isTerminal: isTerminal
                                    };
                                g.upsertVertex(currentVertexName, vertexData);
                                previousVertexNames.forEach(n => g.upsertDirectedEdge(n, currentVertexName));
                                previousPreviousVertexNames = previousVertexNames;
                                previousVertexNames = [currentVertexName];
                            }
                        }
                    }
                });
            } // end rules

        } // end constructor

        toString(): string {
            return [...this.rawRules.entries()].map(e => {
                return `${e[0]} := ${e[1].consequents}`
            }).join("\n");
        }
    }

    export function parser(rules: Grammar) {
        return new GrammarParser(rules);
    }

    export let grammarParser = parser;
    export let syntaxAnalyzer = parser;

    // function _makeParsingRules(rules: ParsingRuleAsTuple[]): ParsingRule[] {
    //     return rules.map(rule => _makeParsingRule(rule[0], rule[1], rule[2]));
    // }
    //
    // function _makeParsingRule(from: string, to: string | string[], nodeFactory: ast.NodeFactoryFun = null): ParsingRule {
    //     const _parse = (tokens: string | string[]): Symbol => {
    //         if (!Array.isArray(tokens)) {
    //             tokens = tokens.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x));
    //         }
    //         let and: Group = {
    //             symbols: [],
    //             operator: "and"
    //         }
    //         const or: Group = {
    //             symbols: [and],
    //             operator: "or"
    //         };
    //
    //         while (tokens.length) {
    //             let token = tokens.shift();
    //             if (!token) {
    //                 continue
    //             }
    //             switch (token) {
    //                 case "(":
    //                     // if a group is present, parse it and put it in and
    //                     let nestingLevel = 1;
    //                     let childTokens = []
    //                     while (nestingLevel > 0 && tokens.length) {
    //                         token = tokens.shift();
    //                         if (token === "(") {
    //                             nestingLevel++;
    //                         } else if (token === ")") {
    //                             nestingLevel--;
    //                             if (nestingLevel > 0) {
    //                                 childTokens.push(token);
    //                             }
    //                         } else {
    //                             childTokens.push(token);
    //                         }
    //                     }
    //                     and.symbols.push(_parse(childTokens));
    //                     break;
    //                 case "|":
    //                     // an or symbol means we add a new and group to the or operation
    //                     and = {
    //                         symbols: [],
    //                         operator: "and"
    //                     };
    //                     or.symbols.push(and)
    //                     break;
    //                 case "+":
    //                 case "?":
    //                 case "*":
    //                     // just get the previous symbol and add the modifier
    //                     and.symbols[and.symbols.length - 1].modifier = token;
    //                     break;
    //                 default:
    //                     // any other token, add it as symbol
    //                     and.symbols.push({name: token} as Reference)
    //                     break;
    //             }
    //         }
    //         // skip symbol groups if they contains only one element and no modifier
    //         // skip or if it has only a child
    //         let result: Symbol = or;
    //         while ((result as any).symbols && (result as Group).symbols.length === 1 && !result.modifier) {
    //             result = (result as Group).symbols[0];
    //         }
    //         return result;
    //     };
    //
    //     return {from: from, to: _parse(to), nodeFactory: nodeFactory};
    // }

}