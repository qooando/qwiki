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
        parents: Set<GrammarNode>
        children: Set<GrammarNode>

        originRuleName?: string,
        mustMatchTerm?: string,
        mustExpandToRuleName?: string,
        groupStartNode?: GrammarNode,
        groupEndNode?: GrammarNode
        astNodeFactoryFun?: ast.AstNodeFactoryFun
    }

    export function linkChildren(from: GrammarNode | GrammarNode[], to: GrammarNode | GrammarNode[]) {
        from = Array.isArray(from) ? from : [from];
        to = Array.isArray(to) ? from : [to];
        from.forEach(f => {
            to.forEach(t => {
                f.children.add(t);
                t.parents.add(f);
            })
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
                visitedTokens: string[]
            }

            // populate graph
            for (const [originalRuleName, consequents, nodeFactory] of rules) {
                if (this.debug) {
                    console.debug(`${originalRuleName} ::= ${consequents}`)
                }
                const
                    // create rule start node
                    ruleStartNode: GrammarNode = {
                        id: `${originalRuleName}${SUFFIX_BEGIN}`,
                        nodeType: GrammarNodeType.RULE_START,
                        parents: new Set(),
                        children: new Set(),
                        originRuleName: originalRuleName,
                        astNodeFactoryFun: nodeFactory
                    },
                    // create rule end node
                    ruleEndNode: GrammarNode = {
                        id: `${originalRuleName}${SUFFIX_END}`,
                        nodeType: GrammarNodeType.RULE_END,
                        parents: new Set(),
                        children: new Set(),
                        originRuleName: originalRuleName,
                        astNodeFactoryFun: nodeFactory
                    };

                // update cross references
                ruleEndNode.groupStartNode = ruleStartNode;
                ruleStartNode.groupEndNode = ruleEndNode;

                // add nodes to graph
                this.addNode(ruleStartNode, ruleEndNode);

                // list tokens to visit for this rule
                let ruleTokensToVisit = [
                    ...consequents.split(/\s+|(?=[()*+?|])/).filter(x => !/^\s*$/.test(x)),
                ];
                // list of parents of the current node, populate it with nodes you
                // want to be the next node parents
                let previousNodes: GrammarNode[] = [ruleStartNode]

                // list of stacked context (shift/unshift, [0] is top)
                // with
                //  - the group start node
                let savedContexts: SaveContext[] = [{
                    groupStartNode: ruleStartNode,
                    visitedTokens: []
                }];
                let visitedContexts: SaveContext[] = [];

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
                                    id: `${originalRuleName}_(_${tokenIndex}${SUFFIX_BEGIN}`,
                                    nodeType: GrammarNodeType.GROUP_START,
                                    parents: new Set(),
                                    children: new Set(),
                                    originRuleName: originalRuleName,
                                },
                                // create a new group end node
                                groupEndNode: GrammarNode = {
                                    id: `${originalRuleName}_)_${tokenIndex}${SUFFIX_END}`,
                                    nodeType: GrammarNodeType.GROUP_END,
                                    parents: new Set(),
                                    children: new Set(),
                                    originRuleName: originalRuleName,
                                };
                            // set cross references
                            groupEndNode.groupStartNode = groupStartNode;
                            groupStartNode.groupEndNode = groupEndNode;

                            // add nodes to the graph
                            this.addNode(groupStartNode, groupEndNode);
                            // connect the start node
                            linkChildren(previousNodes, groupStartNode);
                            // create a new context
                            savedContexts.unshift({
                                groupStartNode: groupStartNode,
                                visitedTokens: [currentToken]
                            });
                            previousNodes = [groupStartNode];
                            break;
                        }
                        case ")": {
                            // this is the end of the current group
                            // parentContext is the context we are going to close
                            let groupEndNode = currentContext.groupStartNode.groupEndNode;
                            // connect the groupEnd to the previous nodes
                            linkChildren(previousNodes, groupEndNode);
                            previousNodes = [groupEndNode];
                            // remove the group context from saved contexts
                            currentContext.visitedTokens.push(currentToken);
                            visitedContexts.unshift(savedContexts.shift());
                            // thus the next context closing connects it to its fail node
                            savedContexts[0].visitedTokens.push(...currentContext.visitedTokens)
                            break;
                        }
                        case "|": {
                            // evaluate this symbol as the END of the sequence of symbols
                            // and start of another sequence
                            // all sequences are bounded to the same start and end groups
                            let groupStartNode = currentContext.groupStartNode,
                                groupEndNode = groupStartNode.groupEndNode;
                            linkChildren(previousNodes, groupEndNode);
                            previousNodes = [groupStartNode]
                            currentContext.visitedTokens.push(currentToken);
                        }
                        case "?": {
                            if (previousNodes.length !== 1) {
                                throw new Error(`Syntax error: too much parents for optional`)
                            }
                            currentContext.visitedTokens.push(currentToken);
                            // this is the optional symbol
                            // previous nodes can be matched or not
                            const prevNode = previousNodes[0];
                            // for each parent we want to add its FAIL condition to parentsOnFailContinue
                            if (prevNode.nodeType === GrammarNodeType.GROUP_END) {
                                // for groups, just provides as new additional parent the parent of the start node
                                // thus skipping the group at all
                                previousNodes.push(...prevNode.groupStartNode.parents)
                            } else {
                                // for normal nodes, just add the parent
                                previousNodes.push(...prevNode.parents)
                            }
                            break;
                        }
                        case "*": {
                            // this is the zero or more repetition
                            if (previousNodes.length !== 1) {
                                throw new Error(`Syntax error: Too much parents for zero or more repetitions`)
                            }
                            currentContext.visitedTokens.push(currentToken);
                            const prevNode = previousNodes[0];
                            if (prevNode.nodeType === GrammarNodeType.GROUP_END) {
                                // for groups add groups start parent to the next parents (allow to skip all)
                                // then link the end node to start node (allow repetition)
                                linkChildren(prevNode, prevNode.groupStartNode);
                                previousNodes.push(...prevNode.groupStartNode.parents)
                            } else {
                                // for the normal nodes just loop on itself
                                linkChildren(prevNode, prevNode);
                                previousNodes.push(...prevNode.parents)
                            }
                            break;
                        }
                        case "+": {
                            if (previousNodes.length !== 1) {
                                throw new Error(`Syntax error: too much parents for one or more repetitions`)
                            }
                            const prevNode = previousNodes[0];
                            // ignore the "+", just copy the last group/symbol in the ruleTokensToVisit and continue
                            // thus A+ will be AA*
                            if (prevNode.nodeType === GrammarNodeType.GROUP_END) {
                                ruleTokensToVisit.unshift(...visitedContexts[0].visitedTokens, "*")
                            } else {
                                ruleTokensToVisit.unshift(currentContext.visitedTokens[currentContext.visitedTokens.length - 1], "*")
                            }
                            break;
                        }
                        default: { // and
                            currentContext.visitedTokens.push(currentToken);
                            // Here we can have rule reference or terminals
                            const newNodeId: string = `${originalRuleName}_${currentToken}_${tokenIndex}`,
                                newNodeType: GrammarNodeType = this.rawRules.has(currentToken) ? GrammarNodeType.RULE_REFERENCE : GrammarNodeType.TERMINAL,
                                // create the new node
                                newNode: GrammarNode = {
                                    id: newNodeId,
                                    nodeType: newNodeType,
                                    children: new Set(),
                                    parents: new Set(),
                                    originRuleName: originalRuleName,
                                    mustMatchTerm: newNodeType === GrammarNodeType.TERMINAL ? currentToken : null,
                                    mustExpandToRuleName: newNodeType === GrammarNodeType.TERMINAL ? null : `${currentToken}${SUFFIX_BEGIN}`
                                };
                            // add node
                            this.addNode(newNode);
                            // link with previous
                            linkChildren(previousNodes, newNode)
                            previousNodes = [newNode];
                        }
                    }
                } // end tokens

                linkChildren(previousNodes, ruleEndNode);
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