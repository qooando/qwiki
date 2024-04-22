import {ModuleManager} from "../../src/core/beans/ModuleManager";
import {Bean} from "../../src/core/beans/Bean";

import {BeanScope} from "../../src/core/beans/BeanUtils";
import * as path from "node:path";
import {Qwiki} from "../../src/core/Qwiki";

describe("Module manager", () => {

    beforeAll(() => {
        let q = new Qwiki();
        q.boot()
    })

    class Foo {
    }

    test("Register bean by descriptor", () => {
        let m = new ModuleManager();
        let d = new Bean(Foo, "myFoo");
        m.addBean(d)
        expect(m.beans.size).toBe(2)
        expect(m.beans.get("class:Foo").size()).toBe(1)
        expect(m.beans.get("myFoo").size()).toBe(1)
        expect(m.beans.get("class:Foo").toSortedArray()).toEqual([d])
        expect(m.beans.get("myFoo").toSortedArray()).toEqual([d])
    })

    test("Register beans from path", () => {
        let m = new ModuleManager();
        let config = {
            searchPaths: [
                "./core/**/*.ts",
                "./modules/**/*.ts",
                path.join(__dirname, "scenarios", "Beans1.*")
            ]
        }
        m.initialize(config)
    })

    test("Autowire beans", () => {

    })

    test("postConstruct", () => {

    })

    test("Action on module initialization", () => {

    })

})