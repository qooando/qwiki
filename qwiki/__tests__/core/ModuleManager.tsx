import {ModuleManager} from "../../src/core/ModuleManager";
import {BeanDescriptor} from "../../src/core/models/BeanDescriptor";
import {BeanScope} from "../../src/core/models/BeanScope";

describe("Module manager", () => {

    class Foo {

    }


    test("Register bean by descriptor", () => {
        let m = new ModuleManager();
        let d: BeanDescriptor = {
            clazz: Foo,
            name: "myFoo",
            priority: 0,
            scope: BeanScope.SINGLETON,
            instances: []
        }
        m.registerBeanFromDescriptor(d)
        expect(m.beans.size).toBe(2)
        expect(m.beans.get("class:Foo").size()).toBe(1)
        expect(m.beans.get("myFoo").size()).toBe(1)
        expect(m.beans.get("class:Foo").toSortedArray()).toEqual([d])
        expect(m.beans.get("myFoo").toSortedArray()).toEqual([d])
    })

    test("Register bean by instance", () => {
        let m = new ModuleManager();
        let i = new Foo();
        let d = m.registerBeanFromInstance(i);
        expect(m.beans.size).toBe(2)
        expect(m.beans.get("class:Foo").size()).toBe(1)
        expect(m.beans.get("foo").size()).toBe(1)
        expect(m.beans.get("class:Foo").toSortedArray()).toEqual([d])
        expect(m.beans.get("foo").toSortedArray()).toEqual([d])
    })

    test("Register bean from class", () => {
        let m = new ModuleManager()
        let d = m.registerBeanFromClass(Foo);
        expect(m.beans.size).toBe(2);
        expect(m.beans.get("class:Foo").size()).toBe(1);
        expect(m.beans.get("foo").size()).toBe(1);
        expect(m.beans.get("class:Foo").toSortedArray()).toEqual([d]);
        expect(m.beans.get("foo").toSortedArray()).toEqual([d]);
        expect(d.instances.length).toEqual(1);
        expect(d.instances.at(0)).toBeInstanceOf(Foo);
    })

})