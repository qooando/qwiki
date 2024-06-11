export namespace iterators {

    export function buffered(iterator: Iterator<any>) {
        return new BufferedIterator(iterator);
    }

    export class BufferedIterator<T, TReturn = any, TNext = undefined> implements Iterator<T, TReturn, TNext> {
        iterator: Iterator<T, TReturn, TNext>;
        buffer: IteratorResult<T, TReturn>[];
        cursor: number;
        marks: number[];

        constructor(iterator: Iterator<T, TReturn, TNext>) {
            this.iterator = iterator;
            this.cursor = 0;
            this.marks = [];
        }

        next(...args: [] | [TNext]): IteratorResult<T, TReturn> {
            let x: IteratorResult<T, TReturn> = null;
            if (this.buffer.length === this.cursor) {
                x = this.iterator.next();
                this.buffer.push(x);
            } else {
                x = this.buffer.at(this.cursor);
            }
            // if we have marks increase cursor
            // otherwise just leave cursor where it is and unshift the buffer
            if (this.marks.length) {
                this.cursor++;
            } else {
                this.buffer.unshift();
            }
            return x;
        }

        mark() {
            this.marks.push(this.cursor);
        }

        unmark() {
            this.marks.pop();
        }

        reset() {
            this.cursor = this.marks.pop();
            this.shiftUnusedBuffer();
        }

        shiftUnusedBuffer() {
            let minCursor = Math.min(this.cursor, ...this.marks);
            this.cursor -= minCursor;
            this.marks = this.marks.map(x => x - minCursor);
            for (let i = 0; i < minCursor; i++) {
                this.buffer.shift()
            }
        }
    }

    // (function () {
    //
    //     const assert = require("assert");
    //
    //     exports.bufferedIterator = function (iterator) {
    //         assert(iterator.next, `iterator argument must be an iterator, not ${typeof iterator}`);
    //         let self = {
    //             history: [],
    //             cursor: 0,
    //             savedCursor: [],
    //             next: () =>{
    //                 let x = null;
    //                 if (self.history.length === self.cursor) {
    //                     x = iterator.next();
    //                     self.history.push(x)
    //                 } else {
    //                     x = self.history[self.cursor];
    //                 }
    //                 self.cursor++;
    //                 return x;
    //             },
    //             rewind: (steps = 1) => {
    //                 self.cursor = Math.max(0, self.cursor - steps);
    //             },
    //             previous: () => {
    //                 self.rewind();
    //                 return self.history[self.cursor];
    //             },
    //             seek: (i) => {
    //                 assert(i >= 0 && i <= self.history.length, `index out of bounds`)
    //                 self.cursor = i;
    //             },
    //             position: () => {
    //                 return self.cursor;
    //             },
    //             reset: () => {
    //                 self.seek(0);
    //             },
    //             saveCursor: () => {
    //                 self.savedCursor.push(self.cursor)
    //             },
    //             restoreCursor: () => {
    //                 if (self.savedCursor.length) {
    //                     self.cursor = self.savedCursor.pop();
    //                 }
    //             },
    //             discardSavedCursor: () => {
    //                 self.savedCursor.pop()
    //             },
    //             [Symbol.iterator]() {
    //                 return self;
    //             }
    //         }
    //         return self;
    //     }
    // })();

}