import {ModuleManager} from "../../src/core/beans/ModuleManager";
import {Bean} from "../../src/core/beans/Bean";

import * as path from "node:path";
import {Qwiki} from "../../src/core/Qwiki";
import {EventNames} from "../../src/core/events/EventNames";
import {Strings} from "../../src/core/utils/Strings";
import * as fs from "node:fs";

describe("Configuration beans", () => {

    afterEach(() => {
        global["$qw"] = null
    })

    test("Load configuration bean from json", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "example.config.json")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.get("Foo").size()).toBe(1)
        let b: any = await m.getBeanInstance("Foo");
        expect(b.foo).toBe("Hello World!")
    })

    test("Load configuration bean from yaml", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "example.config.yaml")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.get("Bar").size()).toBe(1)
        let b: any = await m.getBeanInstance("Bar");
        expect(b.bar).toBe("Hello Bob!")
    })
})