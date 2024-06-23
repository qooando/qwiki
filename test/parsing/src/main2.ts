import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"
import {lexer} from "./base/lexicon.js";
import {render} from "./base/render.js";
import {language} from "./base/language.js";

let enableIfIsCode = (ctx: lexer.LexerContext) => ctx.captureCode
let enableIfIsNotCode = (ctx: lexer.LexerContext) => !ctx.captureCode

let _lexicon: lexer.Lexicon = [
    {
        term: "CODE_START",
        regex: /\{\{/y,
        onMatch: (ctx: lexer.LexerContext) => {
            ctx.captureCode = true;
        }
    },
    {
        term: "CODE_END",
        regex: /}}/y,
        onMatch: (ctx: lexer.LexerContext) => {
            ctx.captureCode = false;
        }
    },
    {enable: enableIfIsCode, term: "GROUP_START", regex: /\(/},
    {enable: enableIfIsCode, term: "GROUP_END", regex: /\)/},
    {enable: enableIfIsCode, term: "IF", regex: /if/},
    {enable: enableIfIsCode, term: "FOREACH", regex: /foreach/},
    {enable: enableIfIsCode, term: "FOR", regex: /for/},
    {enable: enableIfIsCode, term: "ELSE", regex: /else/},
    {enable: enableIfIsCode, term: "END", regex: /end/},
    {enable: enableIfIsCode, term: "WITH", regex: /with/},
    {enable: enableIfIsCode, term: "VARIABLE_IDENTIFIER", regex: /\$[_a-zA-Z0-9]+/},
    {enable: enableIfIsCode, term: "IDENTIFIER", regex: /[_a-zA-Z0-9]+/},
    {enable: enableIfIsCode, term: "PIPE", regex: /\|/},
    {enable: enableIfIsCode, term: "SPACE", regex: /\s+/, onMatch: lexer.onMatch.ignore},
    {
        enable: enableIfIsNotCode,
        term: "TEXT",
        regex: /(.(?!\{\{|}}))*./sy,
        onMatch: lexer.onMatch.concatSameTerm
    }
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





