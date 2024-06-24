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
        ctx.termsBuffer.push({
            term: ctx.rule.term,
            content: ctx.matches[0]
        });
    }],
    ["CODE_END", /}}/y, (ctx: lexer.LexerContext) => {
        ctx.captureCode = false;
        ctx.termsBuffer.push({
            term: ctx.rule.term,
            content: ctx.matches[0]
        });
    }],
    ["GROUP_OPEN", /\(/, null, enableIfIsCode],
    ["GROUP_CLOSE", /\)/, null, enableIfIsCode],
    ["IF", /if/, null, enableIfIsCode],
    // ["FOREACH", /foreach/, null, enableIfIsCode],
    // ["FOR", /for/, null, enableIfIsCode],
    // ["ELSE", /else/, null, enableIfIsCode],
    // ["END", /end/, null, enableIfIsCode],
    // ["WITH", /with/, null, enableIfIsCode],
    ["REFERENCE", /\$/, null, enableIfIsCode],
    ["IDENTIFIER", /[_a-zA-Z0-9]\S*/, null, enableIfIsCode],
    ["STRING", /"([^"]|\\")*"|'([^"]|\\')*'/, null, enableIfIsCode],
    ["NULL", /Null|None/, null, enableIfIsCode],
    ["TRUE", /True/, null, enableIfIsCode],
    ["FALSE", /False/, null, enableIfIsCode],
    ["NUMBER", /[0-9.]+/, null, enableIfIsCode],
    ["SEPARATOR", /(?!\\);/, null, enableIfIsCode],
    ["PIPE", /\|/, null, enableIfIsCode],
    ["SPACE", /\s+/, lexer.onMatch.ignore, enableIfIsCode],
    ["CONTENT", /(.(?!\{\{|}}))*./sy, lexer.onMatch.concatSameTerm, enableIfIsNotCode]
];

let _grammar = [
    ["document", "( CONTENT | code )*"],
    ["code", "CODE_START statement CODE_END?"],
    ["end_statement", "SEPARATOR | CODE_END"], // non capturing rules ?
    ["statement", "( echo ) end_statement"],
    ["echo", "variable | constant"],
    ["variable", "REFERENCE IDENTIFIER"],
    ["constant", "STRING | NUMBER | boolean | NULL"],
    ["boolean", "TRUE | FALSE"]
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

console.log("\nTOKENIZATION")
console.log([...parser.tokenizer.tokenize(content)]);

console.log("\nAST")
parser.debug = true
let ast = parser.parse(content);
console.log(JSON.stringify(ast, null));

console.log("\nRENDERED")
let out: render.StringRenderingContext = lang.render(ast, {
    output: ""
});
console.log(out.output);





