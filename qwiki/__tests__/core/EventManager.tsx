import {Evented, initializeEvented} from "../../src/core/common/Evented";
import {EventContext, EventManager} from "../../src/core/EventManager";


describe('Class implementing Evented', () => {
    class Instrumented implements Evented {
        _eventManager: EventManager
        on: Function
        emit: Function
        emitSync: Function

        constructor() {
            initializeEvented(this)
        }
    }

    test('Instance must define event manager and methods', () => {
        let h = new Instrumented();
        expect(h._eventManager).toBeDefined();
        expect(h.on).toBeDefined();
        expect(h.emit).toBeDefined();
        expect(h.emitSync).toBeDefined();
    });

    test('Register a callback', () => {
        let h = new Instrumented();
        h.on("Foo", (ctx: EventContext) => {
        })
        expect(h._eventManager._callbacks.get("Foo")).toBeDefined()
        expect(h._eventManager._callbacks.get("Bar")).toBeUndefined()
        h.on("Bar", (ctx: EventContext) => {
        })
        expect(h._eventManager._callbacks.get("Foo")).toBeDefined()
        expect(h._eventManager._callbacks.get("Bar")).toBeDefined()
    });

    test('Register callbacks with priority', () => {
        let h = new Instrumented();
        let cb1 = (ctx: EventContext) => {
        };
        let cb2 = (ctx: EventContext) => {
        };
        h.on("Foo", cb1, 15)
        h.on("Foo", cb2, 5)
        expect(h._eventManager._callbacks.get("Foo").size()).toBe(2);
        let cbs = h._eventManager._callbacks.get("Foo").toSortedArray();
        expect(cbs).toStrictEqual([cb2, cb1]);
        expect(cbs[0].priority).toBe(5)
        expect(cbs[1].priority).toBe(15)
    });

    // test('Register callbacks with custom priority', () => {
    //     let h = new Instrumented((a, b) => b.foo - a.foo);
    //     let cb1 = (ctx) => {
    //     };
    //     let cb2 = (ctx) => {
    //     };
    //     h.on("Foo", cb1, {foo: 5})
    //     h.on("Foo", cb2, {foo: 15})
    //     expect(h._callbacks["Foo"].size()).toBe(2);
    //     expect(h._callbacks["Foo"]._items).toStrictEqual([cb2, cb1]);
    //     let cbs = h._callbacks["Foo"].toSortedArray();
    //     expect(cbs).toStrictEqual([cb2, cb1]);
    //     expect(cbs[0].foo).toBe(15)
    //     expect(cbs[1].foo).toBe(5)
    // });
    //
    // test('Emit sync event', () => {
    //     let h = new Instrumented();
    //     let result = {foo: null};
    //     h.on("Foo", (ctx, value) => {
    //         result.foo = value;
    //     })
    //     h.emitSync("Foo", true)
    //     expect(result.foo).toBe(true);
    //     h.emitSync("Foo", false)
    //     expect(result.foo).toBe(false);
    //     h.emitSync("Foo", 14)
    //     expect(result.foo).toBe(14);
    // });
    //
    // test('Emit async event', () => {
    //     let h = new Instrumented();
    //     let result = {foo: null};
    //     h.on("Foo", (ctx, value) => {
    //         result.foo = value;
    //     })
    //     h.emit("Foo", 14).then(() =>
    //         expect(result.foo).toBe(14)
    //     )
    // });
    //
    // test('Sequential callbacks', () => {
    //     let h = new Instrumented();
    //     let result = {foo: null};
    //     h.on("Foo", (ctx, value) => {
    //         result.foo = value;
    //     }, 1)
    //     h.on("Foo", (ctx, value) => {
    //         result.foo = result.foo * 2;
    //     }, 2)
    //     h.emit("Foo", 14).then(() =>
    //         expect(result.foo).toBe(28)
    //     )
    // });

});
