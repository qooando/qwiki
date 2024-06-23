import {quaqua} from "./lang/quaqua.js"
import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let lang = quaqua.lang;
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



