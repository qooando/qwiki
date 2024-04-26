import {ModuleManager} from "../../src/core/beans/ModuleManager";
import {Bean} from "../../src/core/beans/Bean";

import * as path from "node:path";
import {Qwiki} from "../../src/core/Qwiki";
import {EventNames} from "../../src/core/events/EventNames";
import {Strings} from "../../src/core/utils/Strings";
import * as fs from "node:fs";

describe("Load beans from json", () => {

    afterEach(() => {
        global["$qw"] = null
    })

    class Foo {
    }

    test("Load a single bean from json", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Bean1.json")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.get("Foo").size()).toBe(1)
        let b: any = m.beans.get("Foo").top();
        expect(b.foo).toBe("Hello World!")
    })

})