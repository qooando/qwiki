import {ast} from "./ast.js";

export namespace renderer {

    export type NodeVisitorFun = (node: ast.Node, ctx: object) => any;

    export interface NodeVisitor {
        event: string
        visit?: NodeVisitorFun
        before?: NodeVisitorFun
        after?: NodeVisitorFun
    }

    export class GenericRenderer {

        rules: Map<string, NodeVisitor>

        constructor(rules: NodeVisitor[]) {
            rules.forEach(rule => {
                this.rules.set(rule.event, rule);
            });
        }

        render(ast: ast.Node, ctx: object = {}): any {
            let _visit = (ast: ast.Node, ctx: object = {}) => {
                if (ast === null) {
                    throw new Error(`No ast provided`);
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

    export function renderer(rules: NodeVisitor[]) {
        return new GenericRenderer(rules);
    }
    
}