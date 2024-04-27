import {ModuleManager} from "../../src/core/beans/ModuleManager";
import {Bean} from "../../src/core/beans/Bean";

import * as path from "node:path";
import {Qwiki} from "../../src/core/Qwiki";
import {EventNames} from "../../src/core/events/EventNames";
import {Strings} from "../../src/core/utils/Strings";
import * as fs from "node:fs";
import {Bar, Foo} from "./resources/Converter1";
import {ConversionService} from "../../src/modules/conversion/ConversionService";

describe("Conversion service", () => {

    afterEach(() => {
        global["$qw"] = null
    })

    test("Convert foo to bar", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Converter1.ts")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        expect($qw._moduleManager.hasBean("ConversionService")).toBeTruthy()
        expect($qw._moduleManager.hasBean("FooToBarConverter")).toBeTruthy()

        let conversionService: ConversionService = await $qw._moduleManager.getBeanInstance("ConversionService");
        let foo = new Foo("Hello world!");
        let bar = conversionService.convert(foo, Bar);
        expect(bar.bar).toBe("Hello world!");
    })

    test("Convert foo to bar with transformer", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "converter2.transformer.yaml")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        expect($qw._moduleManager.hasBean("ConversionService")).toBeTruthy()
        expect($qw._moduleManager.hasBean("FooToBarConverter")).toBeTruthy()
        expect($qw._moduleManager.beans.get("FooToBarConverter").size()).toBe(1)
        expect($qw._moduleManager.beans.get("FooToBarConverter").top().instances.length).toBe(1)

        let conversionService: ConversionService = await $qw._moduleManager.getBeanInstance("ConversionService");
        let foo = new Foo("Hello world!");
        let bar = conversionService.convert(foo, Bar);
        expect(bar.bar).toBe("Hello world!");
    })
})