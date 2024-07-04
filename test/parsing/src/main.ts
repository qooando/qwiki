import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"
import {lexicon} from "./base/lexicon.js";
import {render} from "./base/render.js";
import {ast} from "./base/ast.js";
import {stringify} from "./base/lang/stringify.js";
import * as yaml from "js-yaml";
import SimpleContext = render.context.SimpleContext;

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
    ["ELSE", /else/, null, enableIfIsCode],
    ["END", /end/, null, enableIfIsCode],
    ["FOREACH", /foreach/, null, enableIfIsCode],
    ["OF", /of/, null, enableIfIsCode],
    ["EQ_ASSIGN", /:=/, null, enableIfIsCode],
    ["EQ_COALESCE", /\?\?=/, null, enableIfIsCode],
    // ["FOR", /for/, null, enableIfIsCode],
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
    ["document", "statement_block*"],
    ["branch", "statement_block*"],
    ["statement_block", "CONTENT+ | code_start? statement+"],
    ["statement_end", "SEPARATOR | CODE_END", ast.nodeFactory.ignore],
    ["code_start", "CODE_START", ast.nodeFactory.ignore],
    ["code_end", "CODE_END", ast.nodeFactory.ignore],
    ["statement", "( if | foreach | echo ) statement_end"],
    ["echo", "variable | constant"],
    ["variable", "REFERENCE IDENTIFIER", (ctx): ast.Node => {
        return {name: ctx.node.name, children: [], content: ctx.node.children[1].content}
    }],
    ["constant", "STRING | NUMBER | boolean | NULL"],
    ["boolean", "TRUE | FALSE"],
    ["if", "IF GROUP_OPEN boolean_expression GROUP_CLOSE statement_end branch else? END"],
    ["boolean_expression", "expression"],
    ["else", "ELSE statement_end? branch"],
    ["expression", "expr_assign | expr_value | GROUP_OPEN expression GROUP_CLOSE"],
    ["expr_assign", "expr_assign_left expr_assign_op expression"],
    ["expr_assign_left", "variable"],
    ["expr_assign_op", "EQ_ASSIGN | EQ_COALESCE | OF"],
    ["expr_value", "variable | constant"],
    ["foreach", "FOREACH GROUP_OPEN expr_assign_of GROUP_CLOSE statement_end branch END"],
    ["expr_assign_of", "expr_assign_left OF expression"],
];
// FIXME current implementation is not properly optimized but it is enough simple
// TODO precompile grammar with optimization, e.g. if a rule does not contain X avoid to visit it at all
//   avoid o visit not useful branches
// TODO maybe transform the grammar in a decision tree to make parsing and ast generation faster ?
//   the tree leaves/nodes are the grammar rules, edges are token terms. A node can be assigned to a rule or be a
//   a middle node with more of a rule we need to discern. IF more rules match, assign the first.
//   how to covert *?= in a decision tree? (a decision graph, better?) --> we need to create the parsing graph
//   with the correct amount of nodes and edges. (primitives to add a new rule in the correct position, a rule can be more than one node)
// TODO look behind and look forward symbols to avoid capturing code end and code start in this symbol?

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let _templateParser = ast.parser(_lexicon, _grammar, {debug: true});

// let _tokens = _templateParser.tokenizer.tokenize(content);

console.log("LEXICAL TOKENIZATION")
for (let t of [..._templateParser.tokenizer.tokenize(content)]) {
    console.log(t);
}

// console.log("\nGRAMMAR")
// console.log(_parser.grammar.toString())

// console.log("\nTOKENIZATION")
// console.log([..._parser.tokenizer.tokenize(content)]);

// console.log("\nABSTRACT SYNTAX TREE")
// _templateParser.debug = true
let _ast = _templateParser.parse(content);
// console.log(JSON.stringify(_ast, null, 2));
// console.log(yaml.dump(_ast));

// console.log("\nAST STRUCTURE")
// console.log(stringify(_ast));

interface ExpressionContext extends SimpleContext<any> {
    expr_stack: []
    expr_result: any
}

let debug = false;

const _expressionEvaluator: render.Renderer<ExpressionContext> = render.renderer({
    _default: render.visitor.renderChildren,
    on_expression: render.visitor.renderChildren,
    on_variable: render.visitor.ignore,
    on_variable_after(node, ctx) {
        ctx.expr_result = ctx.contextVariables[node.content];
    },
    on_boolean_expression: render.visitor.renderChildren,
    on_boolean_expression_after(node, ctx) {
        ctx.expr_result = !!ctx.expr_result;
    },
    on_of_expression: render.visitor.renderChildren,
    on_of_expression_after(node, ctx) {
        // ctx.expr_result = !!ctx.expr_result;
    },
    // FIXME si fa il parsing della espressione e si risolve di conseguenza
    // serve un stack per il calcolo annidato e si risolve il risultato sulla _after
}, {debug: debug});

const _echoRenderer = render.renderer<render.context.SimpleContext<string>>({
    _default: render.visitor.appendPlaceholder(),
    on_variable: render.visitor.appendContextVariableValue,
    on_constant: render.visitor.renderChildren,
    on_boolean: render.visitor.renderChildren,
    on_TRUE: render.visitor.appendContent,
    on_FALSE: render.visitor.appendContent,
    on_STRING: render.visitor.appendContent,
    on_NUMBER: render.visitor.appendContent,
    on_CONTENT: render.visitor.appendContent,
}, {debug: debug});

let _mainRenderer = render.renderer<render.context.SimpleContext<string>>({
    _default: render.visitor.appendPlaceholder(),
    on_document: render.visitor.renderChildren,
    on_branch: render.visitor.renderChildren,
    on_statement_block: render.visitor.renderChildren,
    on_statement: render.visitor.renderChildren,
    on_CONTENT: render.visitor.appendContent,
    on_echo: render.visitor.delegateChildrenTo(_echoRenderer),
    on_IF: render.visitor.ignore,
    on_if(node, ctx) {
        let boolean_expression = node.children.filter(x => x.name === "boolean_expression")[0];
        let exprResult = _expressionEvaluator.render(boolean_expression, {
            expr_result: undefined,
            expr_stack: [],
            output: undefined,
            contextVariables: ctx.contextVariables
        });
        if (!!exprResult.expr_result) {
            let true_branch = node.children.filter(x => x.name === "branch")[0];
            let subctx = ctx.render(true_branch, ctx);
            ctx.output = subctx.output;
        } else {
            let true_branch = node.children.filter(x => x.name === "else")[0];
            let subctx = ctx.render(true_branch, ctx);
            ctx.output = subctx.output;
        }
        return ctx;
    },
    on_expression: render.visitor.delegateTo(_expressionEvaluator),
    on_ELSE: render.visitor.ignore,
    on_else: render.visitor.renderChildren
}, {debug: debug});

console.log("\nRENDER TO HTML")
let out = _mainRenderer.render(_ast, {
    output: "",
    contextVariables: {
        foo: "Hello world!",
        cond1: true
    }
});
console.log(out.output);


