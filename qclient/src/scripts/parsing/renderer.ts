import {parser} from "./parser.js";

export namespace renderer {

    export type RuleFun = (node: parser.Node, ctx: object) => any;

    export interface Rule {
        event: string
        visit: RuleFun
        before: RuleFun
        after: RuleFun
    }

    export class GenericRenderer {

        rules: Map<string, Rule>

        constructor(rules: Rule[]) {
            rules.forEach(rule => {
                this.rules.set(rule.event, rule);
            });
        }

        render(ast: parser.Node, ctx: object = {}): any {
            let _visit = (node: parser.Node, ctx: object = {}) => {
                let rule = this.rules.get(ast.label);
                if (rule && rule.before) {
                    rule.before(node, ctx);
                }
                if (rule && rule.visit) {
                    rule.visit(node, ctx);
                } else {
                    ast.children.forEach(c => _visit(c, ctx));
                }
                if (rule && rule.after) {
                    rule.after(node, ctx);
                }
            }
            return _visit(ast, ctx);
        }

    }

    export function renderer(rules: Rule[]) {
        return new GenericRenderer(rules);
    }
}