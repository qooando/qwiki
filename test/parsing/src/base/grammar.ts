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
        parentsFromSuccess?: GrammarNode[]
        parentsFromFail?: GrammarNode[]
        childOnSuccess?: GrammarNode        // child
        childOnFail?: GrammarNode           // sibling
        astNodeFactoryFun?: ast.AstNodeFactoryFun

        ruleName?: string,
        expectedTerm?: string,
        expectedNodeName?: string,
        groupStartNode?: GrammarNode,
        groupEndNode?: GrammarNode,
        groupFailNode?: GrammarNode,
        astVertexFactoryFun?: ast.AstNodeFactoryFun
    }

    export function linkOnSuccess(from: GrammarNode | GrammarNode[], to: GrammarNode) {
        if (!Array.isArray(from)) {
            from = [from];
        }
        from.forEach(f => {
            if (f.childOnSuccess) {
                throw new Error(`${f.id} &→ ${f.childOnSuccess.id}. Cannot substitute child with ${to.id}`)
            }
            f.childOnSuccess = to;
            to.parentsFromSuccess ??= [];
            if (to.parentsFromSuccess.indexOf(f) < 0) {
                to.parentsFromSuccess.push(f);
            }
        });
    }

    export function linkOnFail(from: GrammarNode | GrammarNode[], to: GrammarNode) {
        if (!Array.isArray(from)) {
            from = [from];
        }
        from.forEach(f => {
            if (f.childOnFail) {
                throw new Error(`${f.id} |→ ${f.childOnSuccess.id}. Cannot substitute child with ${to.id}`)
            }
            f.childOnFail = to
            to.parentsFromFail ??= [];
            if (to.parentsFromFail.indexOf(f) < 0) {
                to.parentsFromFail.push(f);
            }
        });
    }

    export type GrammarRule = [string, string] | [string, string, ast.AstNodeFactoryFun];
    export type Grammar = GrammarRule[];

    export interface GrammarParserOptions {
        debug: boolean
    }

    export class GrammarParser {
        debug: boolean;

        nodes: Map<string, GrammarNode>;
        startNode: GrammarNode;

        rawRules: Map<string, { consequents: string, nodeFactory?: ast.AstNodeFactoryFun }>;
        rawStartRule: string;

        constructor(rules: Grammar, options: GrammarParserOptions = null) {
            this.debug = options?.debug ?? false
            this.rawStartRule = rules[0][0];
            this.rawRules = new Map(rules.map(x => [x[0], {consequents: x[1], nodeFactory: x[2]}]));
            this.nodes = new Map();

            type SaveContext = {
                groupStartNode: GrammarNode,
                toLinkOnFail: GrammarNode[]
            }

            // populate graph
            for (const [ruleName, consequents, nodeFactory] of rules) {
                if (this.debug) {
                    console.debug(`${ruleName} ::= ${consequents}`)
                }
                const
                    // create rule start node
                    ruleStartNode: GrammarNode = {
                        id: `${ruleName}${SUFFIX_BEGIN}`,
                        nodeType: GrammarNodeType.RULE_START,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    },
                    // create rule end node
                    ruleEndNode: GrammarNode = {
                        id: `${ruleName}${SUFFIX_END}`,
                        nodeType: GrammarNodeType.RULE_END,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    },
                    // create rule fail node
                    ruleFailNode: GrammarNode = {
                        id: `${ruleName}${SUFFIX_FAIL}`,
                        nodeType: GrammarNodeType.RULE_FAIL,
                        ruleName: ruleName,
                        astNodeFactoryFun: nodeFactory
                    };
                // update cross references
                ruleStartNode.groupStartNode = ruleEndNode.groupStartNode = ruleFailNode.groupStartNode = ruleStartNode;
                ruleStartNode.groupEndNode = ruleEndNode.groupEndNode = ruleFailNode.groupEndNode = ruleEndNode;
                ruleStartNode.groupFailNode = ruleEndNode.groupFailNode = ruleFailNode.groupFailNode = ruleFailNode;
                // add nodes to graph
                this.addNode(ruleStartNode, ruleEndNode, ruleFailNode);

                // list tokens to visit for this rule
                let ruleTokensToVisit = [
                    ...consequents.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x)),
                ];
                // list of immediate success parents.
                // every new node should be linked to its immediate success parents
                // this permits to define the relationship AND
                let toLinkOnSuccess: GrammarNode[] = [ruleStartNode] // immediate AND parents
                // list of immediate fail parents.
                // every new node should be linked to its immediate fail parents
                // this permits to define the relationship A? A+ A* where the fail is a valid outcome
                let toLinkOnContinueAfterFail: GrammarNode[] = [] // immediate OR parents

                // list of stacked context (shift/unshift, [0] is top)
                // with
                //  - the group start node
                //  - a list of parents for an actual FAIL, we link them to the fail node when group is closed
                let savedContexts: SaveContext[] = [{
                    groupStartNode: ruleStartNode,
                    toLinkOnFail: []
                }];

                // visit tokens until exhaustion.
                let tokenIndex = -1;
                while (ruleTokensToVisit.length) {
                    tokenIndex += 1;
                    const currentToken = ruleTokensToVisit.shift();
                    if (!currentToken) {
                        return;
                    }
                    if (this.debug) {
                        console.debug(` [${tokenIndex}] ${currentToken}`)
                    }
                    const currentContext = savedContexts[0];

                    switch (currentToken) {
                        case "(": {
                            // this is the start of a group
                            const
                                // create a new group start node
                                groupStartNode: GrammarNode = {
                                    id: `${ruleName}_(_${tokenIndex}${SUFFIX_BEGIN}`,
                                    nodeType: GrammarNodeType.GROUP_START,
                                    ruleName: ruleName,
                                },
                                // create a new group end node
                                groupEndNode: GrammarNode = {
                                    id: `${ruleName}_)_${tokenIndex}${SUFFIX_END}`,
                                    nodeType: GrammarNodeType.GROUP_END,
                                    ruleName: ruleName,
                                },
                                // create a new group fail node
                                groupFailNode: GrammarNode = {
                                    id: `${ruleName}_)_${tokenIndex}${SUFFIX_FAIL}`,
                                    nodeType: GrammarNodeType.GROUP_FAIL,
                                    ruleName: ruleName,
                                };
                            // set cross references
                            groupStartNode.groupStartNode = groupEndNode.groupStartNode = groupFailNode.groupStartNode = groupStartNode;
                            groupStartNode.groupEndNode = groupEndNode.groupEndNode = groupFailNode.groupEndNode = groupEndNode;
                            groupStartNode.groupFailNode = groupEndNode.groupFailNode = groupFailNode.groupFailNode = groupFailNode;
                            // add nodes to the graph
                            this.addNode(groupStartNode, groupEndNode, groupFailNode);
                            // connect the start node
                            linkOnSuccess(toLinkOnSuccess, groupStartNode);
                            linkOnFail(toLinkOnContinueAfterFail, groupStartNode);
                            // create a new context
                            savedContexts.unshift({
                                groupStartNode: groupStartNode,
                                toLinkOnFail: []
                            });
                            toLinkOnSuccess = [groupStartNode];
                            toLinkOnContinueAfterFail = [];
                            break;
                        }
                        case ")": {
                            // this is the end of the current group
                            // parentContext is the context we are going to close
                            let groupEndNode = currentContext.groupStartNode.groupEndNode,
                                groupFailNode = currentContext.groupStartNode.groupFailNode;
                            // connect the groupEnd to the previous nodes
                            linkOnSuccess(toLinkOnSuccess, groupEndNode);
                            linkOnFail(toLinkOnContinueAfterFail, groupEndNode);
                            // in case of FAIL go to groupFailNode
                            linkOnFail(currentContext.toLinkOnFail, groupFailNode);
                            toLinkOnSuccess = [groupEndNode];
                            toLinkOnContinueAfterFail = [];
                            // remove the group context from saved contexts
                            savedContexts.shift();
                            // add the groupFailNode in the context parentsOnFail
                            // thus the next context closing connects it to its fail node
                            savedContexts[0].toLinkOnFail.push(groupFailNode);
                            break;
                        }
                        case "|": {
                            // the OR symbol close the previous group and open a new one
                            // these groups are contiguous and the new group is a fallback
                            // if the previous one fails
                            const groupStartId = `${ruleName}_|_${tokenIndex}${SUFFIX_BEGIN}`,
                                groupFailId = `${ruleName}_|_${tokenIndex}${SUFFIX_FAIL}`,
                                groupEndNode = currentContext.groupStartNode.groupEndNode,
                                // create start node
                                groupStartNode: GrammarNode = {
                                    id: groupStartId,
                                    nodeType: GrammarNodeType.GROUP_START,
                                    ruleName: ruleName
                                },
                                // create fail node
                                groupFailNode: GrammarNode = {
                                    id: groupFailId,
                                    nodeType: GrammarNodeType.GROUP_FAIL,
                                    ruleName: ruleName,
                                };
                            // add cross references
                            // NOTE: we use as end node the same end node of the previous group
                            groupStartNode.groupStartNode = groupFailNode.groupStartNode = groupStartNode;
                            groupStartNode.groupEndNode = groupFailNode.groupEndNode = groupEndNode;
                            groupStartNode.groupFailNode = groupFailNode.groupFailNode = groupFailNode;
                            // add the new nodes to the graph
                            this.addNode(groupStartNode, groupFailNode);
                            // link the Start node of this group to the previous fail
                            linkOnFail(currentContext.toLinkOnFail, groupStartNode);
                            // connect previous nodes to the group end
                            linkOnSuccess(toLinkOnSuccess, groupEndNode);
                            linkOnFail(toLinkOnContinueAfterFail, groupEndNode);
                            toLinkOnSuccess = [groupStartNode];
                            toLinkOnContinueAfterFail = [];
                            // remove the previous group context
                            savedContexts.shift();
                            // create a new context for the new group
                            savedContexts.unshift({
                                groupStartNode: groupStartNode,
                                toLinkOnFail: []
                            });
                            break;
                        }
                        case "?": {
                            if (toLinkOnSuccess.length !== 1) {
                                throw new Error(`too much parents for optional`)
                            }
                            // this is the optional symbol
                            // previous nodes can be matched or not
                            for (const p of toLinkOnSuccess) {
                                // for each parent we want to add its FAIL condition to parentsOnFailContinue
                                if (p.nodeType === GrammarNodeType.GROUP_END) {
                                    // for groups, just link the groupFailNode
                                    toLinkOnContinueAfterFail.push(p.groupFailNode);
                                } else {
                                    // for normal nodes, link the node itself on fail
                                    toLinkOnContinueAfterFail.push(p);
                                }

                            }
                            break;
                        }
                        case "*": {
                            // this is the zero or more repetition
                            // repeat on success
                            // continue on fail
                            if (toLinkOnSuccess.length !== 1) {
                                throw new Error(`too much parents for repetition`)
                            }
                            for (const p of toLinkOnSuccess) {
                                // for each parent we want to add its FAIL condition to parentsOnFailContinue
                                if (p.nodeType === GrammarNodeType.GROUP_END) {
                                    // for groups, just link the groupFailNode
                                    linkOnSuccess(p, p.groupStartNode);
                                    toLinkOnContinueAfterFail.push(p.groupFailNode);
                                } else {
                                    // for normal nodes, link the node itself on fail
                                    linkOnSuccess(p, p);
                                    toLinkOnContinueAfterFail.push(p);
                                }

                            }
                            break;
                        }
                        case "+": {
                            if (toLinkOnSuccess.length !== 1) {
                                throw new Error(`too much parents for one or more repetitions`)
                            }
                            // FIXME
                            // expand in ()* directly in tokens to parse


                            break;
                        }
                        default: { // and

                            // terminal or rule reference
                            const newNodeId: string = `${ruleName}_${currentToken}_${tokenIndex}`,
                                newNodeType: GrammarNodeType = this.rawRules.has(currentToken) ? GrammarNodeType.RULE_REFERENCE : GrammarNodeType.TERMINAL,
                                // create the new node
                                newNode: GrammarNode = {
                                    id: newNodeId,
                                    nodeType: newNodeType,
                                    ruleName: ruleName,
                                    expectedTerm: newNodeType === GrammarNodeType.TERMINAL ? currentToken : null,
                                    expectedNodeName: newNodeType === GrammarNodeType.TERMINAL ? null : `${currentToken}${SUFFIX_BEGIN}`
                                };
                            // add node
                            this.addNode(newNode);
                            // link with previous
                            linkOnSuccess(toLinkOnSuccess, newNode)
                            linkOnFail(toLinkOnContinueAfterFail, newNode)
                            // add node on fail
                            currentContext.toLinkOnFail.push(newNode);
                            toLinkOnSuccess = [newNode];
                            toLinkOnContinueAfterFail = [];
                        }
                    }
                } // end tokens

                linkOnSuccess(toLinkOnSuccess, ruleEndNode)
                linkOnFail(toLinkOnContinueAfterFail, ruleEndNode)
                linkOnFail(savedContexts[0].toLinkOnFail, ruleFailNode);
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

    }

    export function parser(rules: Grammar, options: GrammarParserOptions = null) {
        return new GrammarParser(rules, options);
    }

    export let grammarParser = parser;
    export let syntaxAnalyzer = parser;

}