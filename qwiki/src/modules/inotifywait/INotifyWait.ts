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
import * as buffer from "node:buffer";

export interface INotifyWaitOptions {
    bin?: string,
    recursive?: boolean,
    watchDirectory?: boolean,
    excludes?: string[],
    files?: string[],
    events?: string[],
    spawnArgs?: any
}

export enum INotifyWaitEvents {
    ADD = "add",
    MOVE = "move",
    CHANGE = "change",
    UNLINK = "unlink",
    UNKNOWN = "unknown",
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
            '{"type":"%e","file":"%w%f","date":"%T"}',
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
        this.process.on('close', (err: number) => {
            self.process = null;
            self.emit('close', err);
        });
        this.process.on('error', (err: Error) => {
            self.emit('error', err);
        });
        this.process.stdout.on('data', (data: Buffer) => {
            data.toString().split("\n")
                .map(x => x.trim())
                .filter(x => x.length)
                // .map(x => console.log(">", x, "<"))
                .map(x => {
                    self.log.debug(x);
                    try {
                        return JSON.parse(x)
                    } catch (err) {
                        this.emit('error', new Error(err + ' -> ' + x));
                        return {type: '', file: '', date: new Date()};
                    }
                })
                .flatMap((event) => {
                    let date = new Date(event.date * 1000); // Unix Epoch * 1000 = JavaScript Epoch
                    return event.type.split(',')
                        .map((t: string) => {
                            return {type: t, file: event.file, date: date}
                        })
                })
                .forEach((event) => {
                    // skip directories ?
                    var isDir = (event.type.indexOf('ISDIR') != -1);
                    if (isDir && !this.options.watchDirectory) {
                        return;
                    }

                    var stats = {isDir: isDir, date: event.date};
                    if (event.type.indexOf('CREATE') != -1) {
                        self.currentEvents.set(event.file, INotifyWaitEvents.ADD);
                        fs.lstat(event.file, (err, lstats) => {
                            if (!err && !lstats.isDirectory() && (lstats.isSymbolicLink() || lstats.nlink > 1)) {
                                // symlink and hard link does not receive any CLOSE event
                                self.emit('add', event.file, stats);
                                self.currentEvents.delete(event.file);
                            }
                        });
                    } else if (event.type.indexOf('MOVED_TO') != -1) {
                        this.currentEvents.set(event.file, INotifyWaitEvents.MOVE);
                        fs.lstat(event.file, function (err, lstats) {
                            if (!err && !lstats.isDirectory()) {
                                // symlink and hard link does not receive any CLOSE event
                                self.emit('move', event.file, stats);
                                self.currentEvents.delete(event.file);
                            }
                        });
                    } else if (event.type.indexOf('MODIFY') != -1 || // to detect modifications on files
                        event.type.indexOf('ATTRIB') != -1) { // to detect touch on hard link
                        if (!self.currentEvents.has(event.file) ||
                            self.currentEvents.get(event.file) != INotifyWaitEvents.ADD) {
                            self.currentEvents.set(event.file, INotifyWaitEvents.CHANGE);
                        }
                    } else if (event.type.indexOf('DELETE') != -1) {
                        self.emit(INotifyWaitEvents.UNLINK, event.file, stats);
                    } else if (event.type.indexOf('CLOSE') != -1) {
                        if (self.currentEvents.has(event.file)) {
                            this.emit(self.currentEvents.get(event.file), event.file, stats);
                            this.currentEvents.delete(event.file);
                        } else {
                            this.emit(INotifyWaitEvents.UNKNOWN, event.file, event, stats);
                        }
                    }
                })
        });

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

    close(cb: Function): void {
        // if already killed
        if (!this.process) {
            if (cb) {
                this._eventManager.removeAllListeners(); // cleanup
                return cb(null);
            }
            return;
        }
        // if not already killed
        this.on('close', function (err: Error) {
            this.removeAllListeners(); // cleanup
            if (cb) {
                return cb(err);
            }
        });
        this.process.kill();
    }
}
