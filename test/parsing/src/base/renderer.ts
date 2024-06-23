import {parser} from "./parser";

export namespace renderer {

    export type RuleFun = (node: parser.AstNode, ctx: object) => any;

    export interface Rule {
        event: string
        visit?: RuleFun
        before?: RuleFun
        after?: RuleFun
    }

    export class GenericRenderer {

        rules: Map<string, Rule>

        constructor(rules: Rule[]) {
            rules.forEach(rule => {
                this.rules.set(rule.event, rule);
            });
        }

        render(ast: parser.AST, ctx: object = {}): any {
            let _visit = (ast: parser.AST, ctx: object = {}) => {
                if (ast === parser.NO_AST) {
                    throw new Error(`No ast provided`);
                }
                if (ast === parser.EMPTY_AST) {
                    return;
                }
                let rule = this.rules.get(ast.name);
                if (rule && rule.before) {
                    rule.before(ast, ctx);
                }
                if (rule && rule.visit) {
                    rule.visit(ast, ctx);
                } else {
                    ast.children.forEach(c => _visit(c, ctx));
                }
                if (rule && rule.after) {
                    rule.after(ast, ctx);
                }
            }
            return _visit(ast, ctx);
        }

    }

    export function renderer(rules: Rule[]) {
        return new GenericRenderer(rules);
    }
}