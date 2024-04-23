import {Base} from "./base/Base";
import {Configurable, initializeConfigurable} from "./config/Configurable";
import {ApplicationConfig} from "./config/ApplicationConfig";
import * as fs from "fs";
import * as process from "process";
import * as path from "path";
import pino from "pino";
import {ModuleManager} from "./beans/ModuleManager";
import {EventNames} from "./events/EventNames";

declare global {
    var $qw: Qwiki;
    var $log: pino.Logger;
}

export class Qwiki extends Base implements Configurable {

    _configPath: string;
    _reloadConfig: Function;
    config: ApplicationConfig;
    _moduleManager: ModuleManager

    constructor() {
        super();
    }

    async boot(configPath: string | ApplicationConfig = undefined) {
        this.log.info("Boot qwiki")
        global["$qw"] = this;
        global["$log"] = this.log
        await this.loadConfiguration(configPath)
        await this.loadModules()
    }

    async loadConfiguration(configPath: string | ApplicationConfig = undefined) {
        if (configPath && typeof configPath !== "string") {
            this.config = configPath;
            return
        }
        let configPathCandidates = [
            configPath,
            process.env["QWIKICONFIG"],
            "../resources/application.yaml"
        ]
            .filter((x: string) => !!x)
            .map((x: string) => path.join(__dirname, x))
            .map((x: string) => {
                try {
                    var result = fs.realpathSync(x)
                    this.log.debug(`Config file found: ${result}`)
                    return result;
                } catch (e) {
                    this.log.debug(`Config file not found: ${x}`)
                    return undefined
                }
            })
            .filter(x => !!x)
        configPath = configPathCandidates[0];
        try {
            this.log.info(`Load config from: ${configPath}`)
            initializeConfigurable(this, configPath)
        } catch (e) {
            this.log.warn(`Fail to load configuration`)
        }
    }

    async loadModules() {
        await this.emit(EventNames.CORE_BEFORE_INIT)
        this._moduleManager = new ModuleManager();
        await this._moduleManager.initialize(this.config.qwiki.modules)
        await this.emit(EventNames.CORE_AFTER_INIT)
        await this.emit(EventNames.STARTUP)
    }

    async require(identifier: any, optional: boolean = false, asList: boolean = false, keyFun: (x: any) => string = undefined) {
        return await this._moduleManager.getBeanInstance(identifier, optional, asList, keyFun)
    }

}