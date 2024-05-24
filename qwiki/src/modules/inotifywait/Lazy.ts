// import * as util from "util";
// import * as stream from "stream";
// import {EventEmitter} from "events";
//
// export interface LazyOptions {
//     data: string
//     pipe: string
// }
//
// export class Lazy {
//
//     events: EventEmitter = new EventEmitter();
//     dataName: string
//     pipeName: string
//     endName: string
//     opts: LazyOptions;
//
//     constructor(em: any, opts: LazyOptions) {
//         const self = this;
//         this.opts = opts;
//         this.dataName = opts.data || 'data';
//         this.pipeName = opts.pipe || 'pipe';
//         this.endName = opts.pipe || 'end';
//         if (this.pipeName != this.endName) {
//             let piped = false;
//             this.events.once(this.pipeName, function () {
//                 piped = true
//             });
//             this.events.once(this.endName, () => {
//                 if (!piped) self.events.emit(this.pipeName);
//             });
//         }
//
//         if (em && em.on) {
//             em.on(this.endName, () => {
//                 self.events.emit(self.endName);
//             });
//             self.events.on(this.pipeName, () => {
//                 em.emit(self.pipeName);
//             });
//             // Check for v0.10 or Greater (Stream2 has Duplex type)
//             if (stream.Duplex && em instanceof (stream)) {
//                 em.on('readable', () => {
//                     let x = (em as any).read();
//                     self.events.emit(self.dataName, x);
//                 });
//             } else {
//                 // Old Stream1 or Event support
//                 em.on(this.dataName, function (x: any) {
//                     self.events.emit(self.dataName, x);
//                 });
//             }
//         }
//     }
//
//     push(x: any) {
//         this.events.emit(this.dataName, x);
//     }
//
//     end() {
//         this.events.emit(this.endName);
//     }
//
//
//     newLazy(g: any, h: any, l: any) {
//         const self = this;
//         if (!g) {
//             g = function () {
//                 return true;
//             };
//         }
//         if (!h) {
//             h = function (x: any) {
//                 return x;
//             };
//         }
//         var lazy = new Lazy(null, this.opts, l);
//         this.events.on(this.dataName, function (x, y) {
//             if (g.call(lazy, x)) {
//                 lazy.events.emit(self.dataName, h(x), y);
//             }
//         });
//         this.events.once(this.pipeName, function () {
//             lazy.events.emit(self.pipeName);
//         });
//         return lazy;
//     }
//
//     filter(f: any) {
//         return this.newLazy((x: any) => f(x));
//     }
// //     self.filter = function (f) {
// //         return newLazy(function (x) {
// //             return f(x);
// //         });
// //     }
// //
// //     self.forEach = function (f) {
// //         return newLazy(function (x) {
// //             f(x);
// //             return true;
// //         });
// //     }
// //
// //     self.map = function (f) {
// //         return newLazy(
// //             function () { return true },
// //             function (x) { return f(x) }
// //         );
// //     }
// //
// //     self.head = function (f) {
// //         var lazy = newLazy();
// //         lazy.on(dataName, function g (x) {
// //             f(x)
// //             lazy.removeListener(dataName, g)
// //         })
// //     }
// //
// //     self.tail = function () {
// //         var skip = true;
// //         return newLazy(function () {
// //             if (skip) {
// //                 skip = false;
// //                 return false;
// //             }
// //             return true;
// //         });
// //     }
// //
// //     self.skip = function (n) {
// //         return newLazy(function () {
// //             if (n > 0) {
// //                 n--;
// //                 return false;
// //             }
// //             return true;
// //         });
// //     }
// //
// //     self.take = function (n) {
// //         return newLazy(function () {
// //             if (n == 0) self.emit(pipeName);
// //             return n-- > 0;
// //         });
// //     }
// //
// //     self.takeWhile = function (f) {
// //         var cond = true;
// //         return newLazy(function (x) {
// //             if (cond && f(x)) return true;
// //             cond = false;
// //             self.emit(pipeName);
// //             return false;
// //         });
// //     }
// //
// //     self.foldr = function (op, i, f) {
// //         var acc = i;
// //         var lazy = newLazy();
// //         lazy.on(dataName, function g (x) {
// //             acc = op(x, acc);
// //         });
// //         lazy.once(pipeName, function () {
// //             f(acc);
// //         });
// //     }
// //
// //     self.sum = function (f) {
// //         return self.foldr(function (x, acc) { return x + acc }, 0, f);
// //     }
// //
// //     self.product = function (f) {
// //         return self.foldr(function (x, acc) { return x*acc }, 1, f);
// //     }
// //
// //     self.join = function (f) {
// //         var data = []
// //         var lazy = newLazy(function (x) {
// //             data.push(x);
// //             return true;
// //         });
// //         lazy.once(pipeName, function () { f(data) });
// //         return self;
// //     }
// //
// //     self.bucket = function (init, f) {
// //         var lazy = new Lazy(null, opts);
// //         var yieldTo = function (x) {
// //             lazy.emit(dataName, x);
// //         };
// //
// //         var acc = init;
// //
// //         self.on(dataName, function (x) {
// //             acc = f.call(yieldTo, acc, x);
// //         });
// //
// //         self.once(pipeName, function () {
// //             lazy.emit(pipeName);
// //         });
// //
// //         // flush on end event
// //         self.once(endName, function () {
// //             var finalBuffer = mergeBuffers(acc);
// //             if (finalBuffer) {
// //                 yieldTo(finalBuffer);
// //             }
// //         });
// //
// //         return lazy;
// //     }
// //
// //     // Streams that use this should emit strings or buffers only
// //     self.__defineGetter__('lines', function () {
// //         return self.bucket([], function (chunkArray, chunk) {
// //             var newline = '\n'.charCodeAt(0), lastNewLineIndex = 0;
// //             if (typeof chunk === 'string') chunk = new Buffer(chunk);
// //             if (chunk){
// //                 for (var i = 0; i < chunk.length; i++) {
// //                     if (chunk[i] === newline) {
// //                         // If we have content from the current chunk to append to our buffers, do it.
// //                         if (i > 0) {
// //                             chunkArray.push(chunk.slice(lastNewLineIndex, i));
// //                         }
// //
// //                         // Wrap all our buffers and emit it.
// //                         this(mergeBuffers(chunkArray));
// //                         lastNewLineIndex = i + 1;
// //                     }
// //                 }
// //             }
// //
// //             if (lastNewLineIndex > 0) {
// //                 // New line found in the chunk, push the remaining part of the buffer.
// //                 if (lastNewLineIndex < chunk.length) {
// //                     chunkArray.push(chunk.slice(lastNewLineIndex));
// //                 }
// //             } else {
// //                 // No new line found, push the whole buffer.
// //                 if (chunk && chunk.length) {
// //                     chunkArray.push(chunk);
// //                 }
// //             }
// //             return chunkArray;
// //         });
// //     });
// // }
// //
// // Lazy.range = function () {
// //     var args = arguments;
// //     var step = 1;
// //     var infinite = false;
// //
// //     if (args.length == 1 && typeof args[0] == 'number') {
// //         var i = 0, j = args[0];
// //     }
// //     else if (args.length == 1 && typeof args[0] == 'string') { // 'start[,next]..[end]'
// //         var arg = args[0];
// //         var startOpen = false, endClosed = false;
// //         if (arg[0] == '(' || arg[0] == '[') {
// //             if (arg[0] == '(') startOpen = true;
// //             arg = arg.slice(1);
// //         }
// //         if (arg.slice(-1) == ']') endClosed = true;
// //
// //         var parts = arg.split('..');
// //         if (parts.length != 2)
// //             throw new Error("single argument range takes 'start..' or 'start..end' or 'start,next..end'");
// //
// //         if (parts[1] == '') { // 'start..'
// //             var i = parts[0];
// //             infinite = true;
// //         }
// //         else { // 'start[,next]..end'
// //             var progression = parts[0].split(',');
// //             if (progression.length == 1) { // start..end
// //                 var i = parts[0], j = parts[1];
// //             }
// //             else { // 'start,next..end'
// //                 var i = progression[0], j = parts[1];
// //                 step = Math.abs(progression[1]-i);
// //             }
// //         }
// //
// //         i = parseInt(i, 10);
// //         j = parseInt(j, 10);
// //
// //         if (startOpen) {
// //             if (infinite || i < j) i++;
// //             else i--;
// //         }
// //
// //         if (endClosed) {
// //             if (i < j) j++;
// //             else j--;
// //         }
// //     }
// //     else if (args.length == 2 || args.length == 3) { // start, end[, step]
// //         var i = args[0], j = args[1];
// //         if (args.length == 3) {
// //             var step = args[2];
// //         }
// //     }
// //     else {
// //         throw new Error("range takes 1, 2 or 3 arguments");
// //     }
// //     var lazy = new Lazy;
// //     var stopInfinite = false;
// //     lazy.on('pipe', function () {
// //         stopInfinite = true;
// //     });
// //     if (infinite) {
// //         process.nextTick(function g () {
// //             if (stopInfinite) return;
// //             lazy.emit('data', i++);
// //             process.nextTick(g);
// //         });
// //     }
// //     else {
// //         process.nextTick(function () {
// //             if (i < j) {
// //                 for (; i<j; i+=step) {
// //                     lazy.emit('data', i)
// //                 }
// //             }
// //             else {
// //                 for (; i>j; i-=step) {
// //                     lazy.emit('data', i)
// //                 }
// //             }
// //             lazy.emit('end');
// //         });
// //     }
// //     return lazy;
// // }
// //
// // var mergeBuffers = function mergeBuffers(buffers) {
// //     // We expect buffers to be a non-empty Array
// //     if (!buffers || !Array.isArray(buffers) || !buffers.length) return;
// //
// //     var finalBufferLength, finalBuffer, currentBuffer, currentSize = 0;
// //
// //     // Sum all the buffers lengths
// //     finalBufferLength = buffers.reduce(function(left, right) { return (left.length||left) + (right.length||right); }, 0);
// //     finalBuffer = new Buffer(finalBufferLength);
// //     while(buffers.length) {
// //         currentBuffer = buffers.shift();
// //         currentBuffer.copy(finalBuffer, currentSize);
// //         currentSize += currentBuffer.length;
// //     }
// //
// //     return finalBuffer;
// // }
// //
// //
// }
//
// //     self.once = function (name, f) {
// //         self.on(name, function g () {
// //             self.removeListener(name, g);
// //             f.apply(this, arguments);
// //         });
// //     }
