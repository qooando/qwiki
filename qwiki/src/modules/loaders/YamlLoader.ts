import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as fs from "fs";
import * as assert from "assert";
import * as yaml from "yaml";
import {Loader} from "@qwiki/core/loaders/Loader";

export class YamlLoader extends Loader {
    static __bean__: __Bean__ = {
        groups: ["loaders"]
    }

    supportedMimeTypes: Array<string> = [
        "application/yaml",
    ]

    // load(path: string): any {
    //     assert(typeof path === "string");
    //     // @ts-ignore
    //     return yaml.parse(fs.readFileSync(path))
    // }

}
