import {Objects} from "@qwiki/core/utils/Objects";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";
import {Base} from "@qwiki/core/base/Base";
import * as fs from "node:fs";
import * as path from "node:path";
import {Lock} from "@qwiki/core/utils/Synchronize";
import {require} from "@qwiki/core/utils/common";
import {initializeLogged, Logged} from "@qwiki/core/base/Logged";
import pino from "pino";
// let INotifyWait = require('inotifywait');
import {INotifyWait} from "@qwiki/modules/inotifywait/INotifyWait";

export class FilesRepository extends Base {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.files", false)
    }

    basePath: string = Value("qwiki.persistence.files.basePath", "./data")
    monitoringEnabled = Value("qwiki.persistence.files.monitoring", true);
    isMonitoring = false;
    watcher: any = null;
    fileLocks: Map<String, Lock> = new Map();

    async postConstruct() {
        this.log.debug(`Base path: ${this.basePath} (monitoring = ${this.monitoringEnabled})`)
        if (this.monitoringEnabled) {
            this.startMonitoring()
        }
    }

    async save(filePath: string, content: string) {
        return fs.writeFileSync(path.join(this.basePath, filePath), content, {encoding: "utf-8"});
    }

    async load(filePath: string) {
        return fs.readFileSync(path.join(this.basePath, filePath), {encoding: "utf-8"});
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        const self = this;

        // https://github.com/Inist-CNRS/node-inotifywait
        this.watcher = new INotifyWait(this.basePath, {
            recursive: true
        });
    }

    async stopMonitoring() {
        this.isMonitoring = false;
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null;
        }
    }

    async lockFile(filePath: string) {
        if (!this.fileLocks.has(filePath)) {
            this.fileLocks.set(filePath, new Lock());
        }
        return await this.fileLocks.get(filePath).lock();
    }

    async tryLockFile(filePath: string) {
        if (!this.fileLocks.has(filePath)) {
            this.fileLocks.set(filePath, new Lock());
        }
        return await this.fileLocks.get(filePath).tryLock();
    }

    async unlockFile(filePath: string) {
        return await this.fileLocks.get(filePath).unlock();
    }

}