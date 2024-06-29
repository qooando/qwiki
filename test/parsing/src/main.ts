import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"
import {lexicon} from "./base/lexicon.js";
import {render} from "./base/render.js";
import {ast} from "./base/ast.js";
import {stringify} from "./base/lang/stringify.js";
import * as yaml from "js-yaml";

let enableIfIsCode = (ctx: lexicon.LexerContext) => ctx.captureCode
let enableIfIsNotCode = (ctx: lexicon.LexerContext) => !ctx.captureCode

let _lexicon: lexicon.Lexicon = [
    ["CODE_START", /\{\{/y, (ctx: lexicon.LexerContext) => {
        ctx.captureCode = true;
        ctx.termsBuffer.push({
            term: ctx.rule.term,
            content: ctx.matches[0]
        });
    }],
    ["CODE_END", /}}/y, (ctx: lexicon.LexerContext) => {
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
    ["STRING", /"(([^"]|\\")*)"|'(([^"]|\\')*)'/, (ctx: lexicon.LexerContext) => {
        ctx.termsBuffer.push({
            term: ctx.rule.term,
            content: ctx.matches[1]
        });
    }, enableIfIsCode],
    ["NULL", /Null|None/, null, enableIfIsCode],
    ["TRUE", /True/, null, enableIfIsCode],
    ["FALSE", /False/, null, enableIfIsCode],
    ["NUMBER", /[0-9.]+/, null, enableIfIsCode],
    ["SEPARATOR", /(?!\\);/, null, enableIfIsCode],
    ["PIPE", /\|/, null, enableIfIsCode],
    ["SPACE", /\s+/, lexicon.onMatch.ignore, enableIfIsCode],
    ["IDENTIFIER", /[_a-zA-Z0-9]\S*/, null, enableIfIsCode],
    ["CONTENT", /(.(?!\{\{|}}))*./sy, lexicon.onMatch.concatSameTerm, enableIfIsNotCode]
];

let _grammar: grammar.Grammar = [
    ["document", "( CONTENT | code_start statement )*"],
    // ["code", "code_start statement code_end?", ast.nodeFactory.mergeUp], // custom node factory skipping current node and moving all children to upper level?
    ["code_start", "CODE_START", ast.nodeFactory.ignore],
    ["code_end", "CODE_END", ast.nodeFactory.ignore],
    ["statement", "( echo ) end_statement"],
    ["end_statement", "SEPARATOR | code_end", ast.nodeFactory.ignore], // non capturing rules ?
    ["echo", "variable | constant | CONTENT"], // look behind and look forward symbols to avoid capturing code end and code start in this symbol?
    ["variable", "REFERENCE IDENTIFIER", (ctx): ast.Node => {
        return {name: ctx.node.name, children: [], content: ctx.node.children[1].content}
    }], // add a custom function that returns a custom node
    ["constant", "STRING | NUMBER | boolean | NULL"],
    ["boolean", "TRUE | FALSE"]
];

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let _templateParser = ast.parser(_lexicon, _grammar);

// let _tokens = _templateParser.tokenizer.tokenize(content);

// console.log("LEXICAL TOKENIZATION")
// console.log([..._parser.tokenizer.tokenize(content)]);

// console.log("\nGRAMMAR")
// console.log(_parser.grammar.toString())

// console.log("\nTOKENIZATION")
// console.log([..._parser.tokenizer.tokenize(content)]);

// console.log("\nABSTRACT SYNTAX TREE")
// _parser.debug = true
let _ast = _templateParser.parse(content);
// console.log(JSON.stringify(_ast, null, 2));
// console.log(yaml.dump(_ast));

// console.log("\nAST STRUCTURE")
// console.log(stringify(_ast));

const _echoRenderer = render.renderer({
    _default: render.visitor.appendPlaceholder(),
    on_variable: render.visitor.appendContextVariableValue,
    on_constant: render.visitor.renderChildren,
    on_boolean: render.visitor.renderChildren,
    on_TRUE: render.visitor.appendContent,
    on_FALSE: render.visitor.appendContent,
    on_STRING: render.visitor.appendContent,
    on_NUMBER: render.visitor.appendContent,
}, {debug: true});

let _mainRenderer = render.renderer({
    on_CONTENT: render.visitor.appendContent,
    on_echo: render.visitor.delegateChildrenTo(_echoRenderer)
}, {debug: true});

// console.log("\nRENDER TO HTML")
let out = _mainRenderer.render(_ast, {
    output: "",
    contextVariables: {
        foo: "Hello world!"
    }
});
console.log(out.output);





