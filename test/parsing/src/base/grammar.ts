import {ast} from "./ast.js"
import {Graph, Vertex} from "./util/Graph.js";

export namespace grammar {

    const SUFFIX_BEGIN = "_$BEGIN",
        SUFFIX_END = "_$END",
        SUFFIX_FAIL = "_$FAIL";

    export enum GrammarNodeType {
        TERMINAL,
        RULE_START,
        RULE_END,
        RULE_FAIL,
        RULE_REFERENCE,
        GROUP_START,
        GROUP_END,
        GROUP_FAIL
    }

    export interface GrammarNode {
        id: string;
        nodeType: GrammarNodeType
        parents?: GrammarNode[]
        children?: GrammarNode[]    // children of this node
        sibling?: GrammarNode       // children of the same parent THEY ARE IN OR
        astNodeFactoryFun?: ast.AstNodeFactoryFun

        ruleName?: string,
        expectedTerm?: string,
        expectedNodeName?: string,
        groupStartNode?: GrammarNode,
        groupEndNode?: GrammarNode,
        groupFailNode?: GrammarNode,
        astVertexFactoryFun?: ast.AstNodeFactoryFun
    }

    export function linkChild(from: GrammarNode | GrammarNode[], to: GrammarNode) {
        if (!Array.isArray(from)) {
            from = [from];
        }
        from.forEach(f => {
            f.children ??= [];
            f.children.push(to);
            to.parents ??= [];
            to.parents.push(f);
        })
    }

    export function linkSibling(from: GrammarNode | GrammarNode[], to: GrammarNode) {
        if (!Array.isArray(from)) {
            from = [from];
        }
        from.forEach(f => f.sibling = to);
    }

    export type GrammarRule = [string, string] | [string, string, ast.AstNodeFactoryFun];
    export type Grammar = GrammarRule[];

    export class GrammarParser {
        nodes: Map<string, GrammarNode>;
        startNode: GrammarNode;

        rawRules: Map<string, { consequents: string, nodeFactory?: ast.AstNodeFactoryFun }>;
        rawStartRule: string;

        constructor(rules: Grammar) {
            // first rule
            this.rawStartRule = rules[0][0];
            this.rawRules = new Map(rules.map(x => [x[0], {consequents: x[1], nodeFactory: x[2]}]));
            this.nodes = new Map();

            type SaveContext = {
                groupStartNode: GrammarNode,
                orParents: GrammarNode[]
            }

            // populate graph
            for (const [ruleName, consequents, nodeFactory] of rules) {
                // first rule is the starting rule
                const ruleStartId = `${ruleName}${SUFFIX_BEGIN}`,
                    ruleEndId = `${ruleName}${SUFFIX_END}`,
                    ruleFailId = `${ruleName}${SUFFIX_FAIL}`,
                    ruleStartNode: GrammarNode = {
                        id: ruleStartId,
                        nodeType: GrammarNodeType.RULE_START,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    },
                    ruleEndNode: GrammarNode = {
                        id: ruleEndId,
                        nodeType: GrammarNodeType.RULE_END,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    },
                    ruleFailNode: GrammarNode = {
                        id: ruleFailId,
                        nodeType: GrammarNodeType.RULE_FAIL,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    };
                ruleStartNode.groupStartNode = ruleEndNode.groupStartNode = ruleFailNode.groupStartNode = ruleStartNode;
                ruleStartNode.groupEndNode = ruleEndNode.groupEndNode = ruleFailNode.groupEndNode = ruleEndNode;
                ruleStartNode.groupFailNode = ruleEndNode.groupFailNode = ruleFailNode.groupFailNode = ruleFailNode;
                this.addNode(ruleStartNode, ruleEndNode, ruleFailNode);

                let tokens = [
                    ruleStartId,
                    ...consequents.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x)),
                    ruleEndId
                ];
                let andParents: GrammarNode[] = [] // parents

                let savedContexts: SaveContext[] = [{
                    groupStartNode: ruleStartNode,
                    orParents: []
                }];

                tokens.forEach((token, index) => {
                    if (!token) {
                        return;
                    }
                    let parentContext = savedContexts[0];
                    let parentGroupStartNode = parentContext.groupStartNode;
                    let orParents = parentContext.orParents;

                    switch (token) {
                        case "(": { // group
                            const groupStartId = `${ruleName}_(_${index}${SUFFIX_BEGIN}`,
                                groupEndId = `${ruleName}_)_${index}${SUFFIX_END}`,
                                groupFailId = `${ruleName}_)_${index}${SUFFIX_FAIL}`,
                                groupStartNode: GrammarNode = {
                                    id: groupStartId,
                                    nodeType: GrammarNodeType.GROUP_START,
                                    ruleName: ruleName,
                                },
                                groupEndNode: GrammarNode = {
                                    id: groupEndId,
                                    nodeType: GrammarNodeType.GROUP_END,
                                    ruleName: ruleName,
                                },
                                groupFailNode: GrammarNode = {
                                    id: groupFailId,
                                    nodeType: GrammarNodeType.GROUP_FAIL,
                                    ruleName: ruleName,
                                };
                            groupStartNode.groupStartNode = groupEndNode.groupStartNode = groupFailNode.groupStartNode = groupStartNode;
                            groupStartNode.groupEndNode = groupEndNode.groupEndNode = groupFailNode.groupEndNode = groupEndNode;
                            groupStartNode.groupFailNode = groupEndNode.groupFailNode = groupFailNode.groupFailNode = groupFailNode;

                            this.addNode(groupStartNode, groupEndNode, groupFailNode);
                            linkChild(andParents, groupStartNode);
                            savedContexts.push({
                                groupStartNode: groupStartNode,
                                orParents: []
                            });
                            andParents = [groupStartNode];
                            break;
                        }
                        case ")": {
                            let groupEndNode = parentGroupStartNode.groupEndNode,
                                groupFailNode = parentGroupStartNode.groupFailNode;
                            linkChild(andParents, groupEndNode);
                            linkSibling(orParents, groupFailNode);
                            andParents = [groupEndNode];
                            savedContexts.shift();
                            savedContexts[0].orParents.push(groupFailNode);
                            break;
                        }
                        case "|": {
                            const groupStartId = `${ruleName}_|_${index}${SUFFIX_BEGIN}`,
                                groupEndNode: GrammarNode = parentGroupStartNode.groupEndNode,
                                groupFailNode: GrammarNode = parentGroupStartNode.groupFailNode,
                                groupStartNode: GrammarNode = {
                                    id: groupStartId,
                                    nodeType: GrammarNodeType.GROUP_START,
                                    ruleName: ruleName,
                                    groupEndNode: groupEndNode,
                                    groupFailNode: groupFailNode
                                };
                            groupStartNode.groupStartNode = groupStartNode;
                            this.addNode(groupStartNode);
                            linkChild(andParents, groupEndNode);
                            linkSibling(orParents, groupStartNode);
                            savedContexts.shift() // remove previous saved context (the previous group in the same parent group)
                            savedContexts.unshift({
                                groupStartNode: groupStartNode,
                                orParents: []
                            });
                            andParents = [groupStartNode];
                            break;
                        }
                        case "?": {
                            // next node should connect to previous node and its antecedents
                            let grandparentNodes = andParents.flatMap(p => {
                                if (p.nodeType === GrammarNodeType.GROUP_END) {
                                    return p.groupStartNode.parents.slice();
                                } else {
                                    return p.parents.slice();
                                }
                            });
                            // FIXME make them unique
                            andParents = [...grandparentNodes, ...andParents];
                            break;
                        }
                        case "*": {
                            // loop on itself or group
                            // next node should connect to previous node and its antecedents
                            let grandparentNodes = andParents.flatMap(p => {
                                if (p.nodeType === GrammarNodeType.GROUP_END) {
                                    linkChild(p, p.groupStartNode)
                                    return p.groupStartNode.parents.slice();
                                } else {
                                    linkChild(p, p)
                                    return p.parents.slice();
                                }
                            });
                            // FIXME make them unique
                            andParents = [...grandparentNodes, ...andParents];
                            break;
                        }
                        case "+": {
                            // loop on itself
                            andParents.forEach(p => {
                                if (p.nodeType === GrammarNodeType.GROUP_END) {
                                    linkChild(p, p.groupStartNode);
                                } else {
                                    linkChild(p, p)
                                }
                            });
                            break;
                        }
                        default: { // and
                            if (parentGroupStartNode.groupStartNode.id === token && parentGroupStartNode.nodeType === GrammarNodeType.RULE_START) { // start rule
                                const referencedNode = this.nodes.get(token);
                                linkChild(andParents, referencedNode)
                                andParents = [referencedNode];
                            } else if (parentGroupStartNode.groupEndNode.id === token && parentGroupStartNode.nodeType === GrammarNodeType.RULE_END) { // end rule
                                const referencedNode = this.nodes.get(token);
                                linkChild(andParents, referencedNode)
                                linkSibling(orParents, parentGroupStartNode.groupFailNode);
                                andParents = [];
                            } else if (parentGroupStartNode.groupFailNode.id === token && parentGroupStartNode.nodeType === GrammarNodeType.RULE_FAIL) { // fail rule
                                // const referencedNode = this.nodes.get(token);
                                // linkChild(andParents, referencedNode)
                                // andParents = [];
                            } else {
                                // terminal or rule reference
                                const newNodeId: string = `${ruleName}_${token}_${index}`,
                                    newNodeType: GrammarNodeType = this.rawRules.has(token) ? GrammarNodeType.RULE_REFERENCE : GrammarNodeType.TERMINAL,
                                    newNode: GrammarNode = {
                                        id: newNodeId,
                                        nodeType: newNodeType,
                                        ruleName: ruleName,
                                        expectedTerm: newNodeType === GrammarNodeType.TERMINAL ? token : null,
                                        expectedNodeName: newNodeType === GrammarNodeType.TERMINAL ? null : `${token}${SUFFIX_BEGIN}`
                                    };
                                linkChild(andParents, newNode)
                                this.addNode(newNode);
                                orParents.push(newNode);
                                andParents = [newNode];
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

        protected addNode(...nodes: GrammarNode[]) {
            nodes.forEach(node => {
                if (!this.startNode) {
                    this.startNode = node;
                }
                this.nodes.set(node.id, node)
            });
        }

        protected linkChild(from: GrammarNode | GrammarNode[], to: GrammarNode) {
            linkChild(from, to);
        }

        protected linkSibling(from: GrammarNode, to: GrammarNode) {
            linkSibling(from, to);
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