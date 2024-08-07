import {Base} from "@qwiki/core/base/Base";
import {Configurable, initializeConfigurable} from "@qwiki/core/config/Configurable";
import {ApplicationConfig} from "@qwiki/core/config/ApplicationConfig";
import * as fs from "fs";
import * as path from "path";
import pino from "pino";
import {ModuleManager} from "./beans/ModuleManager";
import {EventNames} from "./events/EventNames";
import {Promises} from "@qwiki/core/utils/Promises";
import {AsyncLock} from "@qwiki/core/utils/Concurrence";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// let __dirname = path.resolve();

declare global {
    var $qw: Qwiki;
    var $log: pino.Logger;
}

export class Qwiki extends Base implements Configurable {

    _configPath: string;
    _reloadConfig: Function;
    config: ApplicationConfig;
    _moduleManager: ModuleManager
    _childPromises: Promise<any>[] = [];

    constructor() {
        super();
    }

    async boot(configPath: string | ApplicationConfig = undefined) {
        let self = this;
        this.log.info("Boot qwiki")
        global["$qw"] = this;
        global["$log"] = this.log
        await this.loadConfiguration(configPath)
        await this.loadModules()

        await this.emit(EventNames.STARTUP)

        let stop: AsyncLock = new AsyncLock();
        await stop.lock();

        // graceful shutdown
        async function asyncExitCallback(signal: NodeJS.Signals) {
            self.log.debug(`Received ${signal}`)
            await $qw.emit(EventNames.STOP);
            await stop.unlock();
        }

        process.on('SIGINT', asyncExitCallback);
        process.on('SIGTERM', asyncExitCallback);

        await stop.lock();
        this.log.debug("Exit")
        await $qw.emit(EventNames.END)
        process.exit(0);
    }

    async loadConfiguration(configPath: string | ApplicationConfig = undefined) {
        if (configPath && typeof configPath !== "string") {
            this.config = configPath;
            return
        }
        let searchConfigPaths = [
            configPath,
            process.env["QWIKICONFIG"],
            "./application.yaml",
            "../application.yaml",
            "../resources/application.yaml"
        ];
        let configPathCandidates = searchConfigPaths
            .filter((x: string) => !!x)
            .map((x: string) => path.join(__dirname, x))
            .map((x: string) => {
                try {
                    var result = fs.realpathSync(x)
                    // this.log.debug(`Config file found: ${result}`)
                    return result;
                } catch (e) {
                    // this.log.debug(`Config file not found: ${x}`)
                    return undefined
                }
            })
            .filter(x => !!x)
        configPath = configPathCandidates[0];
        if (!configPath) {
            throw new Error(`No configuration file found: ${searchConfigPaths.join(", ")}`);
        }
        try {
            this.log.info(`Load config from ${configPath}`)
            initializeConfigurable(this, configPath)
        } catch (e) {
            this.log.warn(`Fail to load configuration from ${configPath}`)
            throw e;
        }
    }

    async loadModules() {
        await this.emit(EventNames.CORE_BEFORE_INIT)
        this._moduleManager = new ModuleManager();
        await this._moduleManager.initialize(this.config.qwiki.modules)
        await this.emit(EventNames.CORE_AFTER_INIT)
    }

    // async require(...args: any[]) {
    //     // @ts-ignore
    //     return await this._moduleManager.getBeanInstance(...args)
    // }

}