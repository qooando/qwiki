import {language} from "../language.js"
import {render} from "../render.js"
import {ast} from "../ast.js";

export let stringifyLang = language.language(
    null,
    null,
    [
        ["*", render.onBefore.name(), null]
    ]
);

export function stringify(_ast: ast.Node) {
    let out: render.StringRenderingContext = stringifyLang.render(_ast, {
        output: ""
    });
    return out.output;
}