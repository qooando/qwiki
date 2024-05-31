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
    ALL = "all",
    CREATE = "create",
    MOVE_TO = "move_to",
    MOVE_FROM = "move_from",
    CHANGE = "change",
    REMOVE = "remove",
    UNKNOWN = "unknown",
}

export class INotifyWait extends Base {

    wpath: string;
    options: INotifyWaitOptions;
    currentEvents: Map<string, string> = new Map();
    process: ChildProcess;
    cookies: Map<string, string> = new Map();

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

        this.on(INotifyWaitEvents.CREATE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.CREATE, filePath, stats));
        this.on(INotifyWaitEvents.MOVE_TO, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.MOVE_TO, filePath, stats));
        this.on(INotifyWaitEvents.MOVE_FROM, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.MOVE_FROM, filePath, stats));
        this.on(INotifyWaitEvents.CHANGE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.CHANGE, filePath, stats));
        this.on(INotifyWaitEvents.REMOVE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.REMOVE, filePath, stats));
        this.on(INotifyWaitEvents.UNKNOWN, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.UNKNOWN, filePath, stats));

        this.runProcess();
    }

    runProcess() {
        let args = [
            (this.options.recursive ? '-r' : ''),
            '--format',
            '{"type":"%e","file":"%w%f","cookie":"%c","date":"%T"}',
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
                    // self.log.debug(x);
                    try {
                        return JSON.parse(x)
                    } catch (err) {
                        this.emit('error', new Error(err + ' -> ' + x));
                        return {type: '', file: '', date: new Date()};
                    }
                })
                .map((event) => {
                    let date = new Date(event.date * 1000); // Unix Epoch * 1000 = JavaScript Epoch
                    return {type: event.type.split(','), file: event.file, date: date, cookie: event.cookie}
                })
                .forEach((event) => {
                    // skip directories ?
                    var isDir = event.type.includes('ISDIR');
                    if (isDir && !this.options.watchDirectory) {
                        return;
                    }

                    // console.log(event)
                    var stats: any = {isDir: isDir, date: event.date, cookie: event.cookie};
                    if (event.type.includes('CREATE')) {
                        self.currentEvents.set(event.file, INotifyWaitEvents.CREATE);
                        fs.lstat(event.file, (err, lstats) => {
                            if (!err && !lstats.isDirectory() && (lstats.isSymbolicLink() || lstats.nlink > 1)) {
                                // symlink and hard link does not receive any CLOSE event
                                self.emit(INotifyWaitEvents.CREATE, event.file, stats);
                                self.currentEvents.delete(event.file);
                            }
                        });

                    } else if (event.type.includes('MOVED_TO')) {
                        this.currentEvents.set(event.file, INotifyWaitEvents.MOVE_TO);
                        fs.lstat(event.file, function (err, lstats) {
                            if (!err && !lstats.isDirectory()) {
                                // symlink and hard link does not receive any CLOSE event
                                stats.from = null;
                                if (stats.cookie) {
                                    stats.from = self.cookies.get(stats.cookie);
                                    self.cookies.delete(stats.cookie);
                                }
                                self.emit(INotifyWaitEvents.MOVE_TO, event.file, stats);
                                self.currentEvents.delete(event.file);
                            }
                        });

                    } else if (event.type.includes('MOVED_FROM')) {
                        if (stats.cookie) {
                            stats.from = self.cookies.set(stats.cookie, event.file);
                        }
                        self.emit(INotifyWaitEvents.MOVE_FROM, event.file, stats);

                    } else if (event.type.includes('MODIFY') || // to detect modifications on files
                        event.type.includes('ATTRIB')) { // to detect touch on hard link
                        if (!self.currentEvents.has(event.file) ||
                            self.currentEvents.get(event.file) != INotifyWaitEvents.CREATE) {
                            self.currentEvents.set(event.file, INotifyWaitEvents.CHANGE);
                        }

                    } else if (event.type.includes('DELETE')) {
                        self.emit(INotifyWaitEvents.REMOVE, event.file, stats);

                    } else if (event.type.includes('CLOSE')) {
                        if (self.currentEvents.has(event.file)) {
                            self.emit(self.currentEvents.get(event.file), event.file, stats);
                            this.currentEvents.delete(event.file);
                        } else {
                            self.emit(INotifyWaitEvents.UNKNOWN, event.file, event, stats);
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
