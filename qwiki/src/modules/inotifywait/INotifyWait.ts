/*
 custom version of https://github.com/Inist-CNRS/node-inotifywait/blob/master/lib/inotifywait.js
 library, written in typescript
 */

import * as fs from "fs";

;
import * as util from "util";
import {spawn, ChildProcess} from "child_process";
import {EventEmitter} from "events";
import * as path from "path";
import {Base} from "@qwiki/core/base/Base";

export interface INotifyWaitOptions {
    bin?: string,
    recursive?: boolean,
    watchDirectory?: boolean,
    excludes?: string[],
    files?: string[],
    events?: string[],
    spawnArgs?: any
}

export class INotifyWait extends Base {

    wpath: string;
    options: INotifyWaitOptions;
    currentEvents: Map<string, string> = new Map();
    process: ChildProcess;

    constructor(wpath: string, options: INotifyWaitOptions) {
        super();

        this.wpath = wpath;
        this.options = Object.assign({
            bin: 'inotifywait',
            recursive: true,
            watchDirectory: false,
            excludes: [],
            files: [],
            events: [],
            spawnArgs: {}
        }, options);
        this.runProcess();
    }

    runProcess() {
        let args = [
            (this.options.recursive ? '-r' : ''),
            '--format',
            '{ "type": "%e", "file": "%w%f", "date": "%T" }',
            '--timefmt',
            '%s',
            '-m'
        ];

        // having --exclude
        if (this.options.excludes.length > 0) {
            this.options.excludes.forEach((item) => {
                args.push("--exclude");
                args.push(item);
            });
        }

        // having @
        if (this.options.files.length > 0) {
            this.options.files.forEach((item) => {
                args.push("@" + item);
            });
        }

        // having --event
        if (this.options.events.length > 0) {
            this.options.events.forEach((item) => {
                args.push("--event");
                args.push(item);
            });
        }

        //add path
        args.push(this.wpath);

        // run inotifywait command in background
        const self = this;
        this.process = spawn(this.options.bin, args, this.options.spawnArgs);
        this.process.on('close', (err) => {
            self.process = null;
            self.emit('close', err);
        });
        this.process.on('error', (err) => {
            self.emit('error', err);
        });
        this.process.stdout.on('data', function(data) {
            console.log(data);
            // process.stdout.write(data);
        });


//         // parse stdout of the inotifywatch command
//         Lazy(this.process.stdout)
//             .lines
//             .map(String)
//             .map(function (line) {
//                 try {
//                     return JSON.parse(line);
//                 } catch (err) {
//                     this.emit('error', new Error( err + ' -> ' + line));
//                     return { type: '', file: '' , date: new Date()};
//                 }
//             })
//             .map(function (event) {
//                 event.type = event.type.split(',');
//                 // Unix Epoch * 1000 = JavaScript Epoch
//                 event.date = new Date(event.date * 1000);
//                 return event;
//             })
//             .forEach(function (event) {
//
//                 // skip directories ?
//                 var isDir = (event.type.indexOf('ISDIR') != -1);
//                 if (isDir && !this.options.watchDirectory) {
//                     return;
//                 }
//
//                 var stats = {isDir: isDir, date: event.date};
//
//                 if (event.type.indexOf('CREATE') != -1) {
//                     this.currentEvents[event.file] = 'add';
//                     fs.lstat(event.file, function (err, lstats) {
//                         if (!err && !lstats.isDirectory() && (lstats.isSymbolicLink() || lstats.nlink > 1)) {
//                             // symlink and hard link does not receive any CLOSE event
//                             this.emit('add', event.file, stats);
//                             delete this.currentEvents[event.file];
//                         }
//                     });
//                 } else if (event.type.indexOf('MOVED_TO') != -1) {
//                     this.currentEvents[event.file] = 'move';
//                     fs.lstat(event.file, function (err, lstats) {
//                         if (!err && !lstats.isDirectory()) {
//                             // symlink and hard link does not receive any CLOSE event
//                             this.emit('move', event.file, stats);
//                             delete this.currentEvents[event.file];
//                         }
//                     });
//                 } else if (event.type.indexOf('MODIFY') != -1 || // to detect modifications on files
//                     event.type.indexOf('ATTRIB') != -1) { // to detect touch on hard link
//                     if (this.currentEvents[event.file] != 'add') {
//                         this.currentEvents[event.file] = 'change';
//                     }
//                 } else if (event.type.indexOf('DELETE') != -1) {
//                     this.emit('unlink', event.file, stats);
//                 } else if (event.type.indexOf('CLOSE') != -1) {
//                     if (this.currentEvents[event.file]) {
//                         this.emit(this.currentEvents[event.file], event.file, stats);
//                         delete this.currentEvents[event.file];
//                     } else {
//                         this.emit('unknown', event.file, event, stats);
//                     }
//                 }
//             });
//
//         // parse stderr of the inotifywatch command
//         Lazy(this.process.stderr)
//             .lines
//             .map(String)
//             .forEach(function (line) {
//                 if (/^Watches established/.test(line)) {
//                     // tell when the watch is ready
//                     this.emit('ready', this.process);
//                 } else if (/^Setting up watches/.test(line)) {
//                     // ignore this message
//                 } else {
//                     this.emit('error', new Error(line));
//                 }
//             });
//
//         // Maybe it's not this module job to trap the SIGTERM event on the process
//         // ======>
//         // check if the nodejs process is killed
//         // then kill inotifywait shell command
//         // process.on('SIGTERM', function () {
//         //   if (this.process) {
//         //     this.process.kill();
//         //   }
//         // });
//
    }
}

// // Constructor
// var INotifyWait = function(wpath, options) {
//     var this = this;
//
//     this.wpath = wpath;
//
//     this.currentEvents = {};
//
//     this.runProcess = function () {
//
//         var args = [
//             (this.options.recursive ? '-r' : ''),
//             '--format',
//             '{ "type": "%e", "file": "%w%f", "date": "%T" }',
//             '--timefmt',
//             '%s',
//             '-m'
//         ];
//
//         // having --exclude
//         if(this.options.excludes.length > 0) {
//             this.options.excludes.forEach(function(item){
//                 args.push("--exclude");
//                 args.push(item);
//             });
//         }
//
//         // having @
//         if(this.options.files.length > 0) {
//             this.options.files.forEach(function(item){
//                 args.push("@" + item);
//             });
//         }
//
//         // having --event
//         if(this.options.events.length > 0) {
//             this.options.events.forEach(function (item) {
//                 args.push("--event");
//                 args.push(item);
//             });
//         }
//
//         //add path
//         args.push(wpath);
//
//
//         // run inotifywait command in background
//         this.process = spawn(this.options.bin, args, this.options.spawnArgs);
//         this.process.on('close', function (err) {
//             this.process = null;
//             this.emit('close', err);
//         });
//         this.process.on('error', function (err) {
//             this.emit('error', err);
//         });
//
//         // parse stdout of the inotifywatch command
//         Lazy(this.process.stdout)
//             .lines
//             .map(String)
//             .map(function (line) {
//                 try {
//                     return JSON.parse(line);
//                 } catch (err) {
//                     this.emit('error', new Error( err + ' -> ' + line));
//                     return { type: '', file: '' , date: new Date()};
//                 }
//             })
//             .map(function (event) {
//                 event.type = event.type.split(',');
//                 // Unix Epoch * 1000 = JavaScript Epoch
//                 event.date = new Date(event.date * 1000);
//                 return event;
//             })
//             .forEach(function (event) {
//
//                 // skip directories ?
//                 var isDir = (event.type.indexOf('ISDIR') != -1);
//                 if (isDir && !this.options.watchDirectory) {
//                     return;
//                 }
//
//                 var stats = {isDir: isDir, date: event.date};
//
//                 if (event.type.indexOf('CREATE') != -1) {
//                     this.currentEvents[event.file] = 'add';
//                     fs.lstat(event.file, function (err, lstats) {
//                         if (!err && !lstats.isDirectory() && (lstats.isSymbolicLink() || lstats.nlink > 1)) {
//                             // symlink and hard link does not receive any CLOSE event
//                             this.emit('add', event.file, stats);
//                             delete this.currentEvents[event.file];
//                         }
//                     });
//                 } else if (event.type.indexOf('MOVED_TO') != -1) {
//                     this.currentEvents[event.file] = 'move';
//                     fs.lstat(event.file, function (err, lstats) {
//                         if (!err && !lstats.isDirectory()) {
//                             // symlink and hard link does not receive any CLOSE event
//                             this.emit('move', event.file, stats);
//                             delete this.currentEvents[event.file];
//                         }
//                     });
//                 } else if (event.type.indexOf('MODIFY') != -1 || // to detect modifications on files
//                     event.type.indexOf('ATTRIB') != -1) { // to detect touch on hard link
//                     if (this.currentEvents[event.file] != 'add') {
//                         this.currentEvents[event.file] = 'change';
//                     }
//                 } else if (event.type.indexOf('DELETE') != -1) {
//                     this.emit('unlink', event.file, stats);
//                 } else if (event.type.indexOf('CLOSE') != -1) {
//                     if (this.currentEvents[event.file]) {
//                         this.emit(this.currentEvents[event.file], event.file, stats);
//                         delete this.currentEvents[event.file];
//                     } else {
//                         this.emit('unknown', event.file, event, stats);
//                     }
//                 }
//             });
//
//         // parse stderr of the inotifywatch command
//         Lazy(this.process.stderr)
//             .lines
//             .map(String)
//             .forEach(function (line) {
//                 if (/^Watches established/.test(line)) {
//                     // tell when the watch is ready
//                     this.emit('ready', this.process);
//                 } else if (/^Setting up watches/.test(line)) {
//                     // ignore this message
//                 } else {
//                     this.emit('error', new Error(line));
//                 }
//             });
//
//         // Maybe it's not this module job to trap the SIGTERM event on the process
//         // ======>
//         // check if the nodejs process is killed
//         // then kill inotifywait shell command
//         // process.on('SIGTERM', function () {
//         //   if (this.process) {
//         //     this.process.kill();
//         //   }
//         // });
//
//     };
//
//     this.runProcess();
// }
//
// INotifyWait.prototype = Object.create(EventEmitter.prototype);
//
// INotifyWait.prototype.close = function (cb) {
//     // if already killed
//     if (!this.process) {
//         if (cb) {
//             this.removeAllListeners(); // cleanup
//             return cb(null);
//         }
//         return;
//     }
//     // if not already killed
//     this.on('close', function (err) {
//         this.removeAllListeners(); // cleanup
//         if (cb) {
//             return cb(err);
//         }
//     });
//     this.process.kill();
// };
//
// module.exports = INotifyWait;
//
// /**
//  *  Mixing object properties.
//  */
// var mixin = function() {
//     var mix = {};
//     [].forEach.call(arguments, function(arg) {
//         for (var name in arg) {
//             if (arg.hasOwnProperty(name)) {
//                 mix[name] = arg[name];
//             }
//         }
//     });
//     return mix;
// };