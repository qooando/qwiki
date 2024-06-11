import {parser} from "../parser.js"
import {tokenizer} from "../tokenizer.js";
import {renderer} from "../renderer.js"

/*
 * parser for quaqua template language
 */
export namespace quaqua {
    let scriptTokenizerRules: tokenizer.Rule[] = [
        {label: "GROUP_START", regex: /\(/},
        {label: "GROUP_END", regex: /\)/},
        {label: "IF", regex: /if/},
        {label: "FOREACH", regex: /foreach/},
        {label: "FOR", regex: /for/},
        {label: "ELSE", regex: /else/},
        {label: "END", regex: /end/},
        {label: "WITH", regex: /with/},
        {label: "VARIABLE_IDENTIFIER", regex: /\$[_a-zA-Z0-9]+/},
        {label: "IDENTIFIER", regex: /[_a-zA-Z0-9]+/},
        {label: "PIPE", regex: /\|/},
    ]
    let ScriptTokenizer = tokenizer.tokenizer(scriptTokenizerRules);

    let tokenizerRules: tokenizer.Rule[] = [
        {
            label: "CODE_START",
            regex: /\{\{/,
            onMatch: (ctx: tokenizer.Context) => {
                ctx.captureCode = true;
            }
        },
        {
            label: "CODE_END",
            regex: /\}\}/,
            onMatch: (ctx: tokenizer.Context) => {
                ctx.captureCode = false;
            }
        },
        {
            label: "TEXT_OR_CODE",
            regex: /.*/m,
            onMatch: (ctx: tokenizer.Context) => {
                let top = ctx.tokenBuffer[ctx.tokenBuffer.length - 1];
                let label = ctx.captureCode ? "CODE" : "TEXT";
                if (label === "CODE") {
                    ScriptTokenizer.tokenize(ctx.matches[0], ctx);
                } else {
                    if (top.label === label) {
                        top.content += ctx.matches[0];
                    } else {
                        ctx.tokenBuffer.push({
                            label: label,
                            content: ctx.matches[0]
                        });
                    }
                }
            }
        }
    ];

    let symbols: parser.grammar.Grammar = {
        startSymbol: parser.grammar.toRule("_START", "_STATEMENT"),
        symbols: parser.grammar.toRules([
            ["statement", "block statement?"],
            ["inline_statement", ""],
            ["block", "if | for | with"],
            ["if", "IF GROUP_START inline_statement GROUP_END statement ( ELSE statement )? END"],
            ["for", "FOR GROUP_START inline_statement GROUP_END"],
            ["with", "WITH"],
            ["variable", "IDENTIFIER"],
            ["constant", "TEXT+"]
        ])
    }

    let renderRules: renderer.Rule[] = [];

    let Tokenizer = tokenizer.tokenizer(tokenizerRules);
    let Grammar = parser.parser(Tokenizer, symbols);
    export let Renderer = renderer.renderer(renderRules);
}