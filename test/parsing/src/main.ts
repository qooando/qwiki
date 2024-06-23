import {quaqua} from "./lang/quaqua.js"
import * as fs from "node:fs";
import {parser} from "./base/parser.js"

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let tokens = quaqua.Tokenizer.tokenize(content);

while (true) {
    let token = tokens.next().value;
    if (!token) {
        break;
    }
    console.log(token);
}

console.log();
console.log("GRAMMAR")
let p = quaqua.Parser;
console.log(parser.grammar.grammarToString(p.grammar))

let ast = p.parse(content);
console.log(JSON.stringify(ast))

