import * as uuid from "uuid";
import {assert} from "@qwiki/core/utils/common";

export interface AsyncCallback {
    (...args: any[]): Promise<any>;

    id?: string;
}

export interface EventManagerAlike {
    on: (event: string, cb: AsyncCallback) => void;
    once: (event: string, cb: AsyncCallback) => void;
    emit: (event: string, ...args: any[]) => Promise<any>;
    wait: () => Promise<any>
}

export class EventManager implements EventManagerAlike {

    _events = new Map<string, Map<string, AsyncCallback>>();
    _futures = new Map<string, Promise<any>>;

    on(event: string, cb: AsyncCallback) {
        assert(event);
        assert(cb);
        if (!this._events.has(event)) {
            this._events.set(event, new Map<string, AsyncCallback>);
        }
        cb.id = uuid.v4();
        this._events.get(event).set(cb.id, cb);
    }

    once(event: string, cb: AsyncCallback) {
        assert(event);
        assert(cb);
        const self = this;
        this.on(event, async (...args: any[]) => {
            return await cb(...args)
                .finally(() => self._events.get(event).delete(cb.id));
        })
    }

    async emit(event: string, ...args: any[]) {
        assert(event);
        if (!this._events.has(event)) {
            return;
        }
        const self = this;
        for (let cb of [...this._events.get(event).values()]) {
            self._futures.set(
                cb.id,
                cb(...args).finally(() => self._futures.delete(cb.id))
            );
        }
    }

    async wait() {
        return await Promise.all(this._futures.values());
    }
}