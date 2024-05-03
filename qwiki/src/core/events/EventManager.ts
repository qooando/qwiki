import {Heap} from "../utils/Heap";

import {assert} from "@qwiki/core/utils/common";

export interface EventCallback extends Function {
    (ctx: EventContext, ...args: any[]): Promise<void>;

    priority?: number;
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

    _callbacks: Map<string, Heap<EventCallback>>;
    _comparingFun: Function;

    constructor(comparingFun: Function = undefined) {
        this._callbacks = new Map<string, Heap<EventCallback>>();
        this._comparingFun = comparingFun ?? ((a: EventCallback, b: EventCallback) => (a.priority ?? 0) - (b.priority ?? 0));
    }

    on(event: string, callback: EventCallback, priority: number = undefined) {
        if (priority !== undefined) {
            callback.priority = priority;
        }
        if (!this._callbacks.has(event)) {
            this._callbacks.set(event, new Heap<EventCallback>(this._comparingFun))
        }
        let _callbacks: Heap<EventCallback> = this._callbacks.get(event)
        _callbacks.push(callback)
    }

    async emit(ctx: string | EventContext, ...args: any[]) {
        // this.emitSync(ctx, ...args)
        if (typeof ctx === "string") {
            ctx = {
                event: ctx,
                parallel: false
            }
        }
        assert(ctx.event, `event cannot be ${ctx.event}`)
        // no defined event, exit
        if (!this._callbacks.has(ctx.event)) {
            return
        }
        if (ctx.parallel ?? false) {
            await Promise.all(
                this._callbacks.get(ctx.event).map(
                    (cb: EventCallback) => cb(ctx, ...args)
                )
            );
        } else {
            for (let cb of this._callbacks.get(ctx.event).toSortedArray()) {
                await cb(ctx, ...args);
            }
        }
    }

    // emitSync(ctx: string | EventContext, ...args: any[]) {
    //     if (typeof ctx === "string") {
    //         ctx = {
    //             event: ctx
    //         }
    //     }
    //     assert(ctx.event, `event cannot be ${ctx.event}`)
    //     // no defined event, exit
    //     if (!this._callbacks.has(ctx.event)) {
    //         return
    //     }
    //     if (ctx.parallel ?? false) {
    //         // parallel execution, ignoring priority
    //         this._callbacks.get(ctx.event).forEach(
    //             (cb: EventCallback) => (async () => cb(ctx, ...args))()
    //         )
    //     } else {
    //         this._callbacks.get(ctx.event).forEach(
    //             (cb: EventCallback) => cb(ctx, ...args)
    //         )
    //     }
    // }

}