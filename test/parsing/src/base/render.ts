import {ast} from "./ast.js";

export namespace render {

    export type NodeVisitorFun = (node: ast.Node, ctx: object) => any;

    export interface NodeVisitor {
        event: string
        visit?: NodeVisitorFun
        before?: NodeVisitorFun
        after?: NodeVisitorFun
    }

    export type NodeVisitorTuple = [string, NodeVisitorFun, NodeVisitorFun] | [string, NodeVisitorFun]

    export function _makeNodeVisitor(visitor: NodeVisitorTuple): NodeVisitor {
        return {
            event: visitor[0],
            visit: visitor.length === 2 ? visitor[1] : undefined,
            before: visitor.length === 3 ? visitor[1] : undefined,
            after: visitor.length === 3 ? visitor[2] : undefined
        }
    }

    export function _makeNodeVisitors(visitors: NodeVisitorTuple[]): NodeVisitor[] {
        return visitors.map(_makeNodeVisitor);
    }

    export interface RenderingContext {
        depth?: number

        [x: string]: any
    }

    export interface StringRenderingContext extends RenderingContext {
        output: string;
    }

    export class Renderer {

        rules: Map<string, NodeVisitor>

        constructor(rules: NodeVisitor[]) {
            rules.forEach(rule => {
                this.rules.set(rule.event, rule);
            });
        }

        render(ast: ast.Node, ctx: RenderingContext = null): void {
            ctx ??= {depth: 0};
            ctx.depth ??= 0;
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
                ctx.depth++;
                ast.children.forEach(c => this.render(c, ctx));
                ctx.depth--;
            }
            if (rule && rule.after) {
                rule.after(ast, ctx);
            }
        }
    }

    export function renderer(visitors: NodeVisitor[] | NodeVisitorTuple[]) {
        if (typeof visitors[0] === "string") {
            visitors = _makeNodeVisitors(visitors as NodeVisitorTuple[]);
        }
        return new Renderer(visitors as NodeVisitor[]);
    }

    export namespace onVisit {
        export function renderChildren(node: ast.Node, ctx: RenderingContext) {
            ctx.depth++;
            node.children.forEach(c => this.render(c, ctx));
            ctx.depth--;
        }
    }

    export namespace onBefore {
        export function constant(value: string, indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.indent) : "") + value;
            }
        }

        export function name(value: string, indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.indent) : "") + node.name;
            }
        }

        export function startName(value: string, indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.indent) : "") + "START " + node.name;
            }
        }
    }

    export namespace onAfter {
        export let constant = onBefore.constant;
        export let name = onBefore.name;

        export function endName(value: string, indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.indent) : "") + "END " + node.name;
            }
        }
    }
}