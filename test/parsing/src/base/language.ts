import {lexer} from "./lexicon.js";
import {grammar} from "./grammar.js";
import {ast} from "./ast.js"
import {render} from "./render.js";

export namespace language {

    export class Language {
        parser: ast.Parser;
        renderer: render.Renderer;

        constructor(parser: ast.Parser, renderer: render.Renderer) {
            this.parser = parser;
            this.renderer = renderer;
        }

        parse(raw: string): ast.Node {
            return this.parser.parse(raw);
        }

        render<T extends render.RenderingContext>(node: ast.Node, ctx: T = null): T {
            return this.renderer.render<T>(node, ctx);
        }
    }

    export function language(_parser: ast.Parser,
                             _renderer: render.Renderer | render.NodeVisitor[] | render.NodeVisitorTuple[]): Language;
    export function language(_lexer: lexer.Lexer | lexer.TermDefinition[],
                             _grammar: grammar.Grammar | grammar.RuleTuple[] | string[][] | grammar.Rule[][],
                             _renderer: render.Renderer | render.NodeVisitor[] | render.NodeVisitorTuple[]): Language;
    export function language(...args: any[]): Language {
        switch (args.length) {
            case 2:
                return new Language(args[0], render.renderer(args[1]));
            case 3:
                return new Language(ast.parser(args[0], args[1]), render.renderer(args[2]))
            default:
                throw new Error(`wrong number of parameters`)
        }
    }

}