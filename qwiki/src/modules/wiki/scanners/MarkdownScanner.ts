// // FIXME
//
// /*
//  scan for md files in a folder
//  use mongodb for indexing and whatever?
//  */
// import {Base} from "@qwiki/core/base/Base";
// import {__Bean__} from "@qwiki/core/beans/__Bean__";
// import {Value} from "@qwiki/core/beans/Value";
// import {glob} from "glob";
// import path from "node:path";
// import fs from "node:fs";
//
// export class MarkdownScanner extends Base {
//
//     static __bean__: __Bean__ = {}
//
//     supportedExtensions: string[] = [
//         ".md"
//     ];
//
//     searchPaths = Value("qwiki.modules.searchPaths")
//
//     groups: Map<string, any[]> = new Map<string, any[]>();
//
//     async postConstruct() {
//         const re = new RegExp(this.supportedExtensions.map(x => `${x}$`).join("|"))
//         const files = glob.globSync(this.searchPaths, {})
//             .map(p => path.isAbsolute(p) ? p : path.resolve(p))
//             .filter(p => fs.statSync(p).isFile())
//             .filter(p => re.test(p))
//             .flatMap(files => files)
//
//         files.forEach(file => {
//             let content = fs.readFileSync(file, "utf-8");
//
//
//
//         })
//
//
//         await Promise.all(
//             files.map(file => import(file)
//                 .then(file => Object.entries(file))
//                 .then(contents =>
//                     contents.map(([objName, obj]) => this._registerObject(obj))
//                 )
//             )
//         )
//     }
//
// }
