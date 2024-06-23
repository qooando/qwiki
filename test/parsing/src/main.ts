import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"
import {lexer} from "./base/lexicon.js";
import {render} from "./base/render.js";
import {language} from "./base/language.js";

let enableIfIsCode = (ctx: lexer.LexerContext) => ctx.captureCode
let enableIfIsNotCode = (ctx: lexer.LexerContext) => !ctx.captureCode

let _lexicon: lexer.Lexicon = [
    ["CODE_START", /\{\{/y, (ctx: lexer.LexerContext) => {
        ctx.captureCode = true;
    }],
    ["CODE_END", /}}/y, (ctx: lexer.LexerContext) => {
        ctx.captureCode = false;
    }],
    ["GROUP_START", /\(/, null, enableIfIsCode],
    ["GROUP_END", /\)/, null, enableIfIsCode],
    ["IF", /if/, null, enableIfIsCode],
    ["FOREACH", /foreach/, null, enableIfIsCode],
    ["FOR", /for/, null, enableIfIsCode],
    ["ELSE", /else/, null, enableIfIsCode],
    ["END", /end/, null, enableIfIsCode],
    ["WITH", /with/, null, enableIfIsCode],
    ["VARIABLE_IDENTIFIER", /\$[_a-zA-Z0-9]+/, null, enableIfIsCode],
    ["IDENTIFIER", /[_a-zA-Z0-9]+/, null, enableIfIsCode],
    ["PIPE", /\|/, null, enableIfIsCode],
    ["SPACE", /\s+/, lexer.onMatch.ignore, enableIfIsCode],
    ["TEXT", /(.(?!\{\{|}}))*./sy, lexer.onMatch.concatSameTerm, enableIfIsNotCode]
];

let _grammar = [
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
];

let _rendering: render.NodeVisitorTuple[] = [
    ["*", render.onBefore.name(), null]
    // ["TEXT", render.onVisit.content]
]

let lang = language.language(_lexicon, _grammar, _rendering);

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let parser = lang.parser;
let tokens = parser.tokenizer.tokenize(content);

console.log("LEXICAL TOKENS")
while (true) {
    let token = tokens.next().value;
    if (!token) {
        break;
    }
    console.log(token);
}

console.log("\nGRAMMAR")
console.log(parser.grammar.toString())

console.log("\nAST")
let ast = parser.parse(content);
console.log(JSON.stringify(ast, null));

console.log("\nRENDERED")
let out: render.StringRenderingContext = lang.render(ast, {
    output: ""
});
console.log(out.output);





