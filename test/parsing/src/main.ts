import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"
import {lexer} from "./base/lexicon.js";
import {render} from "./base/render.js";
import {language} from "./base/language.js";
import {ast} from "./base/ast.js";
import {stringify} from "./base/lang/stringify.js";

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

let _grammar: grammar.Rules = [
    ["document", "CONTENT? code* CONTENT?"],
    ["code", "code_start statement code_end?", ast.nodeFactory.mergeUp], // custom node factory skipping current node and moving all children to upper level?
    ["code_start", "CODE_START", ast.nodeFactory.ignore],
    ["code_end", "CODE_END", ast.nodeFactory.ignore],
    ["end_statement", "SEPARATOR | code_end", ast.nodeFactory.ignore], // non capturing rules ?
    ["statement", "( echo ) end_statement"],
    ["echo", "variable | constant | code_end? CONTENT+ code_start?"], // look behind and look forward symbols to avoid capturing code end and code start in this symbol?
    ["variable", "REFERENCE IDENTIFIER", (ctx): ast.Node => {
        return {name: ctx.node.name, children: [], content: ctx.node.children[1].content}
    }], // add a custom function that returns a custom node
    ["constant", "STRING | NUMBER | boolean | NULL"],
    ["boolean", "TRUE | FALSE"]
];

let _rendering: render.NodeVisitors = [
    // ["*", render.onBefore.name(), null],
    ["variable", (node: ast.Node, ctx: render.StringRenderingContext) => {
        ctx.output += ctx.vars[node.content];
    }, null],
    ["CONTENT", render.onVisit.content]
]

let lang = language.language(_lexicon, _grammar, _rendering);

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let _parser = lang.parser;
let _tokens = _parser.tokenizer.tokenize(content);

console.log("LEXICAL TOKENS")
while (true) {
    let token = _tokens.next().value;
    if (!token) {
        break;
    }
    console.log(token);
}

console.log("\nGRAMMAR")
console.log(_parser.grammar.toString())

console.log("\nTOKENIZATION")
console.log([..._parser.tokenizer.tokenize(content)]);

console.log("\nAST")
// _parser.debug = true
let _ast = _parser.parse(content);
console.log(JSON.stringify(_ast, null));

console.log("\nRENDERED test")
console.log(stringify(_ast));

console.log("\nRENDERED")
let out: render.StringRenderingContext = lang.render(_ast, {
    output: "",
    vars: {
        foo: "Hello world!"
    }
});
console.log(out.output);





