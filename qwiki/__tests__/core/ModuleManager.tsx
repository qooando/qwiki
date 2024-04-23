import {ModuleManager} from "../../src/core/beans/ModuleManager";
import {Bean} from "../../src/core/beans/Bean";

import * as path from "node:path";
import {Qwiki} from "../../src/core/Qwiki";
import {EventCallback} from "../../src/core/events/EventManager";
import {Parking} from "./resources/Beans2";
import {Car} from "./resources/Beans3";
import {EventNames} from "../../src/core/events/EventNames";
import {Strings} from "../../src/core/utils/Strings";

describe("Module manager", () => {

    beforeAll(() => {

    })

    afterEach(() => {
        global["$qw"] = null
    })

    class Foo {
    }

    test("Register bean by descriptor", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = new ModuleManager();
        let d = new Bean(Foo, "myFoo");
        m.addBean(d)
        expect(m.beans.size).toBe(2)
        expect(m.beans.get("class:Foo").size()).toBe(1)
        expect(m.beans.get("myFoo").size()).toBe(1)
        expect(m.beans.get("class:Foo").toSortedArray()).toEqual([d])
        expect(m.beans.get("myFoo").toSortedArray()).toEqual([d])
    })

    test("Register beans from path", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Beans1.ts")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.has("Foo")).toBeTruthy()
        expect(m.beans.has("class:Foo")).toBeTruthy()
        expect(m.beans.has("myBar")).toBeTruthy()
        expect(m.beans.has("class:Bar")).toBeTruthy()
        expect(m.beans.has("myBaz")).toBeTruthy()
        expect(m.beans.has("class:Baz")).toBeTruthy()
        expect(m.beans.has("group:myGroup")).toBeTruthy()
        expect(m.beans.has("class:Parent")).toBeTruthy()
    })

    test("Autowire beans", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Beans2.ts")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.has("Panda")).toBeTruthy();
        expect(m.beans.has("class:Panda")).toBeTruthy();
        expect(m.beans.has("myPunto")).toBeTruthy();
        expect(m.beans.has("class:Punto")).toBeTruthy();
        expect(m.beans.has("Parking")).toBeTruthy();
        expect(m.beans.has("class:Parking")).toBeTruthy();
        expect(m.beans.has("group:myOldCars")).toBeTruthy();
        expect(m.beans.has("class:Car")).toBeTruthy();
        let p: Parking = await m.getBeanInstance(Parking);
        expect(p.panda.name).toBe("Panda");
        expect(p.punto.name).toBe("Punto");
        expect(p.myOldCars.length).toBe(1);
        expect(p.cars.length).toBe(2);
        expect(p.carsByName.size).toBe(2);
    })

    test("postConstruct", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Beans3.ts")
                    ]
                }
            }
        }
        let q = new Qwiki();
        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.has("Car")).toBeTruthy();
        let c: Car = await m.getBeanInstance("Car");
        expect(c.model).toBe("Panda");
    })

    test("Action on module initialization", async () => {
        let config = {
            qwiki: {
                modules: {
                    searchPaths: [
                        "./core/**/*.ts",
                        "./modules/**/*.ts",
                        path.join(__dirname, "resources", "Beans3.ts")
                    ]
                }
            }
        }
        let q = new Qwiki();

        let content = {
            carModel: "Unknown"
        }

        q.on(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, "Car"),
            async (ctx, bean: Bean, instance: Car) => {
                content.carModel = instance.model;
            })

        await q.boot(config)
        let m = q._moduleManager;
        expect(m.beans.has("Car")).toBeTruthy();
        let c: Car = await m.getBeanInstance("Car");
        expect(c.model).toBe("Panda");
        expect(content.carModel).toBe("Panda")
    })

})