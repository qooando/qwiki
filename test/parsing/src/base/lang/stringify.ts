import {render} from "../render.js"
import {ast} from "../ast.js";

export let stringifyLang = render.renderer(
    [["*", render.visitor.appendName(), null]]
);

export function stringify(_ast: ast.Node) {
    let out: render.context.SimpleContext<string> = stringifyLang.render(_ast, {
        output: ""
    });
    return out.output;
}