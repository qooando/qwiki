import {__Bean__} from "../../core/beans/__Bean__";
import {BeanConstants, BeanScope} from "../../core/beans/BeanUtils";
import {glob} from "glob";
import {Bean} from "@qwiki/core/beans/Bean";
import * as path from "node:path";
import * as fs from "node:fs";
import {Value} from "@qwiki/core/beans/Value";
import {Base} from "@qwiki/core/base/Base";

/**
 * Scan all js files, scan them, find objects and group them by different criteria
 * Default criteria:
 *  group by an existing static property starting with __ and ending with __, e.g. __entity__, __bean__
 */
export class DuckTypingScanner extends Base {
    static __bean__: __Bean__ = {}

    supportedExtensions: string[] = [
        ".js",
        ".ts"
    ];

    searchPaths = Value("qwiki.modules.searchPaths")

    groups: Map<string, any[]> = new Map<string, any[]>();

    async postConstruct() {
        const re = new RegExp(this.supportedExtensions.map(x => `${x}$`).join("|"))
        const files = glob.globSync(this.searchPaths, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .filter(p => re.test(p))
            .flatMap(files => files)

        await Promise.all(
            files.map(file => import(file)
                .then(file => Object.entries(file))
                .then(contents =>
                    contents.map(([objName, obj]) => this._registerObject(obj))
                )
            )
        )
    }

    async _registerObject(obj: any) {
        return await Promise.all(
            Object.entries(obj)
                .filter(([key, value]) => key.startsWith("__") && key.endsWith("__"))
                .map(([key, value]) => {
                    if (!this.groups.has(key)) {
                        this.groups.set(key, []);
                    }
                    this.groups.get(key).push(obj);
                    return [key, obj]
                })
        );
    }

    get(key: string, defaultValue: any[] = []) {
        return this.groups.has(key) ? this.groups.get(key) : defaultValue;
    }

}
