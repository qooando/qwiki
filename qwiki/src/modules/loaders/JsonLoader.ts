import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as fs from "fs";
import * as assert from "assert";
import {Loader} from "@qwiki/core/loaders/Loader";

export class JsonLoader extends Loader {
    static __bean__: __Bean__ = {}

    supportedMimeTypes: Array<string> = [
        "application/json",
    ]

    // load(path: string): any {
    //     assert(typeof path === "string");
    //     return fs.readFileSync(path).toJSON();
    // }

}
