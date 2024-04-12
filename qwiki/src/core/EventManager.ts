import {Heap} from "./utils/Heap";
import * as assert from "assert";

export interface EventCallback extends Function {
    priority: number;
}

export interface EventContext extends Object {
    event: string,
    parallel?: boolean
}

/**
 * This class permits to register events and call them
 * Callbacks on an event can be ordered
 */
export class EventManager {

    _callbacks: Map<string, Heap<Function>>;
    _comparingFun: Function;

    constructor(comparingfun: Function = undefined) {
        this._callbacks = new Map<string, Heap<Function>>();
        this._comparingFun = comparingfun ?? ((a: EventCallback, b: EventCallback) => (a.priority ?? 0) - (b.priority ?? 0));
    }

    on(event: string, callback: EventCallback | Function) {
        if (!this._callbacks.has(event)) {
            this._callbacks.set(event, new Heap<Function>())
        }
        let _callbacks: Heap<Function> = this._callbacks.get(event)
        _callbacks.push(callback)
    }

    async emit(ctx: string | EventContext, ...args: any[]) {
        this.emitSync(ctx, ...args)
    }

    emitSync(ctx: string | EventContext, ...args: any[]) {
        if (typeof ctx === "string") {
            ctx = {
                event: ctx
            }
        }
        assert(ctx.event, `event cannot be ${ctx.event}`)
        // no defined event, exit
        if (!this._callbacks.has(ctx.event)) {
            return
        }
        if (ctx.parallel ?? false) {
            // parallel execution, ignoring priority
            this._callbacks.get(ctx.event).forEach(
                (cb: EventCallback) => (async () => cb(ctx, ...args))()
            )
        } else {
            this._callbacks.get(ctx.event).forEach(
                (cb: EventCallback) => cb(ctx, ...args)
            )
        }
    }

}