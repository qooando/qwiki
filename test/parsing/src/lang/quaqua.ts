import {parser} from "../base/parser.js"
import {tokenizer} from "../base/tokenizer.js";
import {renderer} from "../base/renderer.js"

/*
 * parser for quaqua template language
 */
export namespace quaqua {
    let enableIfIsCode = (ctx: tokenizer.Context) => ctx.captureCode
    let enableIfIsNotCode = (ctx: tokenizer.Context) => !ctx.captureCode

    let tokenizerRules: tokenizer.Rule[] = [
        {
            label: "CODE_START",
            regex: /\{\{/y,
            onMatch: (ctx: tokenizer.Context) => {
                ctx.captureCode = true;
            }
        },
        {
            label: "CODE_END",
            regex: /}}/y,
            onMatch: (ctx: tokenizer.Context) => {
                ctx.captureCode = false;
            }
        },
        {enable: enableIfIsCode, label: "GROUP_START", regex: /\(/},
        {enable: enableIfIsCode, label: "GROUP_END", regex: /\)/},
        {enable: enableIfIsCode, label: "IF", regex: /if/},
        {enable: enableIfIsCode, label: "FOREACH", regex: /foreach/},
        {enable: enableIfIsCode, label: "FOR", regex: /for/},
        {enable: enableIfIsCode, label: "ELSE", regex: /else/},
        {enable: enableIfIsCode, label: "END", regex: /end/},
        {enable: enableIfIsCode, label: "WITH", regex: /with/},
        {enable: enableIfIsCode, label: "VARIABLE_IDENTIFIER", regex: /\$[_a-zA-Z0-9]+/},
        {enable: enableIfIsCode, label: "IDENTIFIER", regex: /[_a-zA-Z0-9]+/},
        {enable: enableIfIsCode, label: "PIPE", regex: /\|/},
        {enable: enableIfIsCode, label: "SPACE", regex: /\s+/, onMatch: tokenizer.onMatch.ignore},
        {
            enable: enableIfIsNotCode,
            label: "TEXT",
            regex: /(.(?!\{\{|}}))*./sy,
            onMatch: tokenizer.onMatch.concatSameLabel
        }
    ];

    let symbols: parser.grammar.Grammar = {
        rules: parser.grammar.toRules([
            ["__START__", "statement*"],
            ["statement", "block"],
            ["inline_statement", ""],
            ["block", "if | for | with | echo"],
            ["if", "IF GROUP_START inline_statement GROUP_END statement ( ELSE statement )? END"],
            ["for", "FOR GROUP_START inline_statement GROUP_END"],
            ["with", "WITH"],
            ["echo", "variable | constant"],
            ["variable", "VARIABLE_IDENTIFIER"],
            ["constant", "TEXT+"]
        ])
    }

    // let renderRules: renderer.Rule[] = [];

    export let Tokenizer = tokenizer.tokenizer(tokenizerRules);
    export let Parser = parser.parser(Tokenizer, symbols);
    // export let Renderer = renderer.renderer(renderRules);
}