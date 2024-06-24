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

    export interface Rule {
        from: string
        to: Symbol
    }

    export type RuleTuple = ([string, string] | [string, string, any]);

    export function _makeRules(rules: RuleTuple[]): Rule[] {
        return rules.map(rule => _makeRule(rule[0], rule[1], rule[2]));
    }

    export function _makeRule(from: string, to: string | string[], additionalFields: any = {}): Rule {
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

        return Object.assign({from: from, to: _parse(to)}, additionalFields);
    }

    export class Grammar {
        rules: Map<string, Rule>;
        startRule: Rule;

        constructor(rules: Rule[]) {
            this.rules = new Map(rules.map(r => [r.from, r]));
            this.startRule = this.rules.get("__START__") ?? rules[0];
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
            let _ruleToString = (rule: Rule) => {
                return rule.from + " ::= " + _symbolToString(rule.to);
            }
            return [...this.rules.values()].map(x => _ruleToString(x)).join("\n");
        }
    }

    export function grammar(rules: Rule[] | string[][] | RuleTuple[]) {
        if (Array.isArray(rules[0])) {
            rules = _makeRules(rules as RuleTuple[]);
        }
        return new Grammar(rules as Rule[]);
    }

}