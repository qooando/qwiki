import {BeanConstants} from "@qwiki/core/beans/BeanUtils";
import {ModuleScanner} from "@qwiki/core/beans/ModuleScanner";
import {Bean} from "@qwiki/core/beans/Bean";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as yaml from "yaml";
import * as fs from "node:fs";
import * as uuid from "uuid";
import * as path from "node:path";

export class YamlConfigScanner extends ModuleScanner {
    static __bean__: __Bean__ = {}

    supportedExtensions = [
        ".config.json",
        ".config.yaml",
    ]

    async findBeansByPath(file: string): Promise<Bean[]> {
        // @ts-ignore
        let content: any = yaml.parse(fs.readFileSync(file))
        let beanInfo = content[BeanConstants.BEAN_FIELD_NAME] ?? {};
        beanInfo.name = beanInfo.name ?? path.basename(file);
        beanInfo.path = file;
        class InlineClass {
            static __bean__: __Bean__ = beanInfo
        }
        return [new Bean(InlineClass)]
    }

}

//     JavascriptModuleLoader.prototype.loadManifest = function (uri, options = {}) {
//         options = Object.assign({
//             missingManifestPolicy: "warning",
//         }, options);
//         assert(typeof uri === "string");
//         assert(uri.endsWith(".js"));
//         if (!fs.existsSync(uri)) {
//             this.logger.error(`File not found: ${uri}`)
//             return null
//         }
//         const data = fs.readFileSync(uri, options.encoding || "utf-8");
//         let startIndex = data.indexOf("exports.__qwiki__");
//         if (startIndex < 0) {
//             switch (options.missingManifestPolicy) {
//                 case "nothing":
//                     return null;
//                 case "warning":
//                     this.logger.debug(`Manifest not found in ${uri}`);
//                     return null;
//                 default:
//                 case "error":
//                     throw new Error(`Manifest not found in ${uri}`);
//             }
//         }
//         // get the full structure of __qwiki__ object
//         // without actually read the full content
//         // note, we need to count parenthesis
//         startIndex = data.indexOf("{", startIndex);
//         let nesting = 1,
//             endIndex = startIndex + 1;
//         while (data[endIndex] !== "}" && nesting > 0) {
//             endIndex = data.slice(endIndex).search(/[{}]/) + endIndex
//             if (endIndex < 0) {
//                 throw new Error(`Parsing error, missing { or } while reading __qwiki__ object`);
//             }
//             nesting = nesting + (data[endIndex] === "{") - (data[endIndex] === "}")
//         }
//         let manifest = null;
//
//         try {
//             manifest = new Function("return " + data.slice(startIndex, endIndex + 1))()
//         } catch (e) {
//             this.logger.error(`${e.constructor.name} while loading ${uri}:\n${"return " + data.slice(startIndex, endIndex + 1)}`)
//             throw e;
//         }
//
//         // search for $qw.require and add them to requires
//         for (const match of data.matchAll(/\$qw\.require\(\s*"([^)]+)\s*"\)/gm)) {
//             (manifest.requires ??= []).push(match[1]);
//         }
//
//         // search for $qw.autowire and add them to autowires
//         // FIXME
//         // for (const match of data.matchAll(/\$qw\.autowire\(\s*"([^)]+)\s*"\)/gm)) {
//         //     (manifest.autowire ??= []).push(match[1]);
//         // }
//
//         return new ModuleManifest(manifest);
//     }
//
//     JavascriptModuleLoader.prototype.loadContent = function (uri, options = {}) {
//         if (uri instanceof ModuleManifest) {
//             uri = uri.uri;
//         }
//         assert(typeof uri === "string");
//
//         /*
//          * NOTE: to avoid a initialization problem with require.cache
//          * add a init() method, called on startup
//          */
//         let content = require(uri);
//
//         if (content.init) {
//             content.init(this.ctx)
//         }
//
//         return content;
//     }
//
//     // exports.moduleLoader = new JavascriptModuleLoader();
//
//     exports.init = function (ctx = $qw) {
//         // NOTE: initialization workaround for require cache
//         // if we reload the module, the new JavascriptModuleLoader() is caller every time
//         exports.moduleLoader = new JavascriptModuleLoader(ctx = $qw);
//     }
//
// })()
//
