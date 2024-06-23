import {quaqua} from "./lang/quaqua.js"
import * as fs from "node:fs";
import {grammar} from "./base/grammar.js"

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let parser = quaqua.parser;
let tokens = parser.tokenizer.tokenize(content);

console.log("LEXICON")
while (true) {
    let token = tokens.next().value;
    if (!token) {
        break;
    }
    console.log(token);
}

// console.log();
// console.log("GRAMMAR")
// let p = quaqua.Parser;
// console.log(grammar.grammar.grammarToString(p.grammar))
//
// let ast = p.parse(content);
// console.log(JSON.stringify(ast))

