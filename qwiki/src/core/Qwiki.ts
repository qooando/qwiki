import {Base} from "./common/Base";
import {Configurable, initializeConfigurable} from "./common/Configurable";
import {ApplicationConfig} from "./models/ApplicationConfig";
import * as fs from "fs";
import * as process from "process";
import * as path from "path";
import pino from "pino";
import {ModuleManager} from "./ModuleManager";
import {EventNames} from "./models/EventNames";

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

    async boot(configPath: string = undefined) {
        this.log.info("Boot qwiki")
        global["$qw"] = this;
        global["$log"] = this.log
        this.loadConfiguration(configPath)
        this.loadModules()
    }

    loadConfiguration(configPath: string = undefined) {
        let configPathCandidates = [
            configPath,
            process.env["QWIKICONFIG"],
            "../resources/application.yaml"
        ]
            .filter(x => !!x)
            .map(x => path.join(__dirname, x))
            .map(x => {
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

    loadModules() {
        this.emitSync(EventNames.CORE_BEFORE_INIT)
        this._moduleManager = new ModuleManager();
        this._moduleManager.initialize()
        this.emitSync(EventNames.CORE_AFTER_INIT)
        this.emitSync(EventNames.STARTUP)
    }

}
