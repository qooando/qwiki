import {EventEmitter} from "events";
import {EventManager} from "@qwiki/core/events/EventManager";
import {Promises} from "@qwiki/core/utils/Promises";

export class Lock {

    locked: boolean = false;
    waitingQueue: EventEmitter[] = []
    events: EventEmitter = new EventEmitter();

    async tryLock(): Promise<boolean> {
        if (this.locked) {
            return false;
        } else {
            this.locked = true;
            return true;
        }
    }

    async lock(): Promise<boolean> {
        if (this.lock) {
            let event = new EventEmitter();
            this.waitingQueue.push(event)
            await new Promise((resolve) => event.once("unlocked", resolve));
        } else {
            this.locked = true;
            this.events.emit("locked")
        }
        return true;
    }

    async unlock(): Promise<void> {
        if (this.waitingQueue.length) {
            this.waitingQueue.pop().emit("unlocked");
        } else {
            this.locked = false;
            this.events.emit("unlocked")
        }
    }

}

export class Semaphore {

    count: number = Number.MAX_SAFE_INTEGER;
    waitingQueue: EventEmitter[] = []
    events: EventEmitter = new EventEmitter();

    constructor(countMax: number = Number.MAX_SAFE_INTEGER) {
        this.count = countMax;
    }

    async tryAcquire() {
        if (this.count > 0) {
            this.count -= 1;
            return true;
        } else {
            return false;
        }
    }

    async acquire() {
        if (this.count > 0) {
            this.count -= 1;
            if (this.count == 0) {
                this.events.emit("acquired")
            }
        } else {
            let event = new EventEmitter();
            this.waitingQueue.push(event)
            await new Promise((resolve) => event.once("released", resolve));
        }
        return true;
    }

    async release() {
        if (!this.waitingQueue.length) {
            this.count += 1;
            if (this.count == 1) {
                this.events.emit("released")
            }
        } else {
            this.waitingQueue.pop().emit("released");
        }
    }

}