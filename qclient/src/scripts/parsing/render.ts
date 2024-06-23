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

        visitors: Map<string, NodeVisitor>

        constructor(rules: NodeVisitor[]) {
            this.visitors = new Map<string, NodeVisitor>();
            rules.forEach(rule => {
                this.visitors.set(rule.event, rule);
            });
        }

        render<T extends RenderingContext>(ast: ast.Node, ctx: T = null): T {
            ctx ??= {depth: 0} as T;
            ctx.depth ??= 0;
            if (ast === null) {
                throw new Error(`No ast provided`);
            }
            let rule = this.visitors.get(ast.name);
            rule ??= this.visitors.get("*")
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
            return ctx;
        }
    }

    export function renderer(visitors: NodeVisitor[] | NodeVisitorTuple[]) {
        if (Array.isArray(visitors[0])) {
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

        export function content(node: ast.Node, ctx: StringRenderingContext) {
            ctx.output += node.content;
        }
    }

    export namespace onBefore {
        export function constant(value: string, indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + value + "\n";
            }
        }

        export function name(indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + node.name + "\n";
            }
        }

        export function startName(indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + "START " + node.name + "\n";
            }
        }
    }

    export namespace onAfter {
        export let constant = onBefore.constant;
        export let name = onBefore.name;

        export function endName(indent: boolean = true) {
            return (node: ast.Node, ctx: StringRenderingContext): void => {
                ctx.output += (indent ? " ".repeat(ctx.indent) : "") + "END " + node.name + "\n";
            }
        }
    }
}