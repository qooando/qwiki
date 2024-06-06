/*
 custom version of https://github.com/Inist-CNRS/node-inotifywait/blob/master/lib/inotifywait.js
 library, written in typescript
 */

import * as fs from "fs";
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
    spawnArgs?: any,
    restartOnDeleteSelf?: boolean,
    ignoreMissingSelf?: boolean,
}

export enum INotifyWaitEvents {
    ALL = "all",
    CREATE = "create",
    MOVE_TO = "move_to",
    MOVE_FROM = "move_from",
    CHANGE = "change",
    REMOVE = "remove",
    UNKNOWN = "unknown",
    START = "start",
    STOP = "stop",
    RESTART = "restart",
    REMOVE_SELF = "remove_self"
}

export class INotifyWait extends Base {

    watchPath: string;
    options: INotifyWaitOptions;
    currentEvents: Map<string, [string, any]> = new Map();
    process: ChildProcess;
    cookies: Map<string, string> = new Map();

    constructor(wpath: string, options: INotifyWaitOptions) {
        super();

        this.watchPath = wpath;
        this.options = Object.assign({
            bin: 'inotifywait',
            recursive: true,
            watchDirectory: false,
            excludes: [],
            files: [],
            events: [],
            spawnArgs: {},
            restartOnDeleteSelf: true,
            ignoreMissingSelf: true,
        }, options);

        this.on(INotifyWaitEvents.CREATE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.CREATE, filePath, stats));
        this.on(INotifyWaitEvents.MOVE_TO, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.MOVE_TO, filePath, stats));
        this.on(INotifyWaitEvents.MOVE_FROM, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.MOVE_FROM, filePath, stats));
        this.on(INotifyWaitEvents.CHANGE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.CHANGE, filePath, stats));
        this.on(INotifyWaitEvents.REMOVE, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.REMOVE, filePath, stats));
        this.on(INotifyWaitEvents.UNKNOWN, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.UNKNOWN, filePath, stats));
        this.on(INotifyWaitEvents.REMOVE_SELF, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.REMOVE_SELF, filePath, stats));
        // this.on(INotifyWaitEvents.START, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.START, this.watchPath));
        // this.on(INotifyWaitEvents.STOP, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.STOP, this.watchPath));
        // this.on(INotifyWaitEvents.RESTART, async (filePath: string, stats: any) => await this.emit(INotifyWaitEvents.ALL, INotifyWaitEvents.RESTART, this.watchPath));

        this.start();
    }

    start(isRestart: boolean = false) {
        // FIXME avoid polling
        if (this.options.ignoreMissingSelf && !fs.existsSync(this.watchPath)) {
            setTimeout(this.start, 1000);
            return
        }

        this.log.debug(`🗲 Start monitoring ${this.watchPath}`)

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
        args.push(this.watchPath);

        // run inotifywait command in background
        const self = this;
        this.process = spawn(this.options.bin, args, this.options.spawnArgs);
        if (isRestart) {
            this.emit(INotifyWaitEvents.RESTART, this.watchPath);
        } else {
            this.emit(INotifyWaitEvents.START, this.watchPath);
        }
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
                        self.emit('error', new Error(err + ' -> ' + x));
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

                    var stats: any = {isDir: isDir, date: event.date, cookie: event.cookie};
                    if (event.type.includes('CREATE')) {
                        self.emit(INotifyWaitEvents.CREATE, event.file, stats);
                        self.currentEvents.delete(event.file);
                    } else if (event.type.includes('MODIFY')) {
                        self.emit(INotifyWaitEvents.CHANGE, event.file, stats);
                    } else if (event.type.includes('DELETE')) {
                        self.emit(INotifyWaitEvents.REMOVE, event.file, stats);
                    } else if (event.type.includes('MOVED_TO')) {
                        stats.from = null;
                        if (stats.cookie) {
                            stats.from = self.cookies.get(stats.cookie);
                            self.cookies.delete(stats.cookie);
                        }
                        self.emit(INotifyWaitEvents.MOVE_TO, event.file, stats);
                    } else if (event.type.includes('MOVED_FROM')) {
                        if (stats.cookie) {
                            stats.from = self.cookies.set(stats.cookie, event.file);
                        }
                        self.emit(INotifyWaitEvents.MOVE_FROM, event.file, stats);
                    } else if (event.type.includes('DELETE_SELF')) {
                        self.emit(INotifyWaitEvents.REMOVE_SELF, event.file, stats);
                        if (self.options.restartOnDeleteSelf && (
                            event.file === self.watchPath ||
                            event.file === self.watchPath + "/"
                        )) {
                            self.restart();
                        }
                    }
                })
        });
    }

    stop(cb: Function = undefined): void {
        // if already killed
        // if (!this.process) {
        //     if (cb) {
        //         this._eventManager.removeAllListeners(); // cleanup
        //         return cb(null);
        //     }
        //     return;
        // }
        // // if not already killed
        // this.on('close', function (err: Error) {
        //     this.removeAllListeners(); // cleanup
        //     if (cb) {
        //         return cb(err);
        //     }
        // });
        if (this.process) {
            this.log.debug(`🗲 Stop monitoring ${this.watchPath}`)
            this.process.kill();
            this.emit(INotifyWaitEvents.STOP, this.watchPath);
        }
        this.process = null;
    }

    restart() {
        this.stop();
        this.start(true);
    }
}
