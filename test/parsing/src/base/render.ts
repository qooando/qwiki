import {ast} from "./ast.js";

export namespace render {

    export type RenderNodeFunction<Result> = (node: ast.Node, ctx: RenderingContext<Result>) => any;

    export interface RenderingRule<Result> {
        event: string
        visit?: RenderNodeFunction<Result>
        before?: RenderNodeFunction<Result>
        after?: RenderNodeFunction<Result>
    }

    export let isVisitor = (x: any) => x && "event" in x;
    export let isArrayOfVisitors = (x: any) => x && isVisitor(x[0]);

    export interface RenderingDelegate<Result> {
        // _default?: VisitNodeFunction;
        // [key: string]: ((node: ast.Node, ctx: object) => any);
        // x(node: ast.Node, ctx: object): any
        [key: string]: RenderNodeFunction<Result>
    }

    export type RenderingRuleAsTuple<Result> =
        [string, RenderNodeFunction<Result>]
        | [string, RenderNodeFunction<Result>, RenderNodeFunction<Result>]
        | [string, RenderNodeFunction<Result>, RenderNodeFunction<Result>, RenderNodeFunction<Result>];
    export let isVisitorAsTuple = (x: any) => Array.isArray(x) && typeof x[1] === "function" && x.length >= 2 && x.length <= 4;
    export let isArrayOfVisitorAsTuple = (x: any) => Array.isArray(x) && isVisitorAsTuple(x[0]);

    export type RenderingRules<Result> =
        RenderingRule<Result>[]
        | RenderingRuleAsTuple<Result>[]
        | RenderingDelegate<Result>;

    export type RenderFunction<Output> = (<Context extends RenderingContext<Output>>(ast: ast.Node, ctx: Context) => Context);

    export interface RenderingContext<Output> {
        output: Output
        depth?: number
        render?: RenderFunction<Output>
        renderChildren?: RenderFunction<Output>
        contextVariables?: any
    }

    export interface RendererOptions {
        debug?: boolean
    }

    export class Renderer<Result> {
        debug: boolean
        renderingRules: Map<string, RenderingRule<Result>>
        renderingDelegate: RenderingDelegate<Result>

        constructor(rules: RenderingRules<Result>, options: RendererOptions = undefined) {
            this.debug = options.debug ?? false;
            if (isArrayOfVisitorAsTuple(rules)) {
                this.renderingRules = new Map<string, RenderingRule<Result>>((rules as RenderingRuleAsTuple<Result>[])
                    .map((x: RenderingRuleAsTuple<Result>) => {
                        switch (x.length) {
                            case 2:
                                return [x[0], {event: x[0], visit: x[1]} as RenderingRule<Result>];
                            case 3:
                                return [x[0], {event: x[0], before: x[1], after: x[2]} as RenderingRule<Result>];
                            case 4:
                                return [x[0], {
                                    event: x[0],
                                    visit: x[1],
                                    before: x[2],
                                    after: x[3]
                                } as RenderingRule<Result>];
                        }
                    })
                    .map((e: [string, RenderingRule<Result>]) => {
                        e[1].visit ??= this.renderChildren.bind(this)
                        return e;
                    })
                );
                this.renderingDelegate = null;
            } else if (isArrayOfVisitors(rules)) {
                this.renderingRules = new Map<string, RenderingRule<Result>>((rules as RenderingRule<Result>[])
                    .map(x => [x.event, x])
                    .map((e: [string, RenderingRule<Result>]) => {
                        e[1].visit ??= this.renderChildren.bind(this)
                        return e;
                    })
                );
                this.renderingDelegate = null;
            } else {
                this.renderingRules = null;
                this.renderingDelegate = rules as RenderingDelegate<Result>;
            }
        }

        renderChildren(ast: ast.Node, ctx: RenderingContext<Result> = null): RenderingContext<Result> {
            ctx.depth++;
            ast.children.forEach(c => this.render(c, ctx));
            ctx.depth--;
            return ctx;
        }

        render(ast: ast.Node, ctx: RenderingContext<Result> = null): RenderingContext<Result> {
            ctx ??= {depth: 0} as RenderingContext<Result>;
            ctx.depth ??= 0;
            ctx.contextVariables ??= {};
            ctx.render ??= this.render.bind(this);
            ctx.renderChildren ??= this.renderChildren.bind(this);

            if (ast === null) {
                throw new Error(`No ast provided`);
            }
            if (this.renderingRules) {
                let rule = this.renderingRules.get(ast.name) ?? this.renderingRules.get("*");
                if (rule && rule.before) {
                    rule.before(ast, ctx);
                }
                if (rule && rule.visit) {
                    rule.visit(ast, ctx);
                } else {
                    ctx.renderChildren(ast, ctx);
                }
                if (rule && rule.after) {
                    rule.after(ast, ctx);
                }
            } else {
                let ruleName: string = `on_${ast.name}_before`;
                let rule: RenderNodeFunction<Result> = this.renderingDelegate[ruleName];
                if (rule) {
                    rule(ast, ctx);
                }
                ruleName = `on_${ast.name}`;
                rule = this.renderingDelegate[ruleName];
                if (!rule) {
                    if (this.debug) {
                        console.log(`${" ".repeat(ctx.depth)}${ast.name} → ${ruleName} not found`);
                    }
                    ruleName = `_default`;
                    rule = this.renderingDelegate[ruleName];
                }
                if (!rule) {
                    if (this.debug) {
                        console.log(`${" ".repeat(ctx.depth)}${ast.name} → ${ruleName} not found`);
                    }
                    ruleName = `*fallback*`
                    rule = ctx.renderChildren
                }
                if (this.debug) {
                    console.log(`${" ".repeat(ctx.depth)}${ast.name} → ${ruleName} → ${rule.name || rule.constructor.name || rule}`);
                }
                rule(ast, ctx);
                ruleName = `on_${ast.name}_after`;
                rule = this.renderingDelegate[ruleName];
                if (rule) {
                    rule(ast, ctx);
                }
            }
            return ctx;
        }
    }

    export function renderer<Result>(rules: RenderingRules<Result>, options: RendererOptions = undefined) {
        return new Renderer(rules, options);
    }

    export namespace visitor {
        export function appendContextVariableValue(node: ast.Node, ctx: RenderingContext<string>) {
            ctx.output += ctx.contextVariables[node.content];
            return ctx;
        }

        export function renderChildren<Result>(node: ast.Node, ctx: RenderingContext<Result>) {
            return ctx.renderChildren(node, ctx);
        }

        export function appendContent(node: ast.Node, ctx: RenderingContext<string>) {
            ctx.output += node.content;
            return ctx;
        }

        export function delegateTo<Result>(renderer: Renderer<Result>) {
            return function _delegateTo(node: ast.Node, ctx: RenderingContext<Result>) {
                let subctx = Object.assign({}, ctx);
                subctx.render = null;
                subctx.renderChildren = null;
                subctx = renderer.render(node, subctx); // context switch and back
                ctx.output = subctx.output;
                return ctx;
            }
        }

        export function delegateChildrenTo<Result>(renderer: Renderer<Result>) {
            return function _delegateChildrenTo(node: ast.Node, ctx: RenderingContext<Result>) {
                let subctx = Object.assign({}, ctx);
                subctx.render = null;
                subctx.renderChildren = null;
                subctx = renderer.renderChildren(node, subctx); // context switch and back
                ctx.output = subctx.output;
                return ctx;
            }
        }

        export function appendConstant(value: string, indent: boolean = true) {
            return function _appendConstant(node: ast.Node, ctx: RenderingContext<string>) {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + value + "\n";
                return ctx;
            }
        }

        export function appendPlaceholder(indent: boolean = true) {
            return function _appendPlaceholder(node: ast.Node, ctx: RenderingContext<string>) {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + "[[" + node.name + "]]\n";
                return ctx;
            }
        }

        export function appendName(indent: boolean = true) {
            return function _appendName(node: ast.Node, ctx: RenderingContext<string>) {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + node.name + "\n";
                return ctx;
            }
        }

        export function appendNameStart(indent: boolean = true) {
            return function _appendNameStart(node: ast.Node, ctx: RenderingContext<string>) {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + "START " + node.name + "\n";
                return ctx;
            }
        }

        export function appendNameEnd(indent: boolean = true) {
            return function _appendNameEnd(node: ast.Node, ctx: RenderingContext<string>) {
                ctx.output += (indent ? " ".repeat(ctx.depth) : "") + "END " + node.name + "\n";
                return ctx;
            }
        }
    }

}