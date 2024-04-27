export class AsyncLock {

    locked: boolean = false;
    queue: any[] = [];

    async lock() {
        if (this.locked) {
            return new Promise((resolve) => this.queue.push(resolve));
        } else {
            this.locked = true;
            return Promise.resolve();
        }
    }

    async unlock() {
        const next = this.queue.shift();
        if (next) {
            return next();
        } else {
            this.locked = false;
        }
    }

}