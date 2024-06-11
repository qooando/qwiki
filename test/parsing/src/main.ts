import {quaqua} from "./lang/quaqua.js"
import * as fs from "node:fs";

let content = fs.readFileSync(`${process.cwd()}/asset/template1.html`, "utf8");
let tokens = quaqua.Tokenizer.tokenize(content);

while (true) {
    let token = tokens.next().value;
    if (!token) {
        break;
    }
    console.log(token);
}
// let tokens = [...quaqua.Tokenizer.tokenize(content)];
//
// console.log(JSON.stringify(tokens, null, 2));