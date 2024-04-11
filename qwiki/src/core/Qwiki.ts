import {Base} from "./common/Base";
import {Configurable, initializeConfigurable} from "./common/Configurable";
import {ApplicationConfig} from "./models/ApplicationConfig";
import * as fs from "fs";
import * as process from "process";
import * as path from "path";

export class Qwiki extends Base implements Configurable {

    _configPath: string;
    _reloadConfig: Function;
    config: ApplicationConfig;

    static Events: object = {
        CORE_BEFORE_INIT: "CORE_BEFORE_INIT",
        CORE_AFTER_INIT: "CORE_AFTER_INIT",
        STARTUP: "STARTUP",
        END: "END"
    }

    constructor(configPath: string = undefined) {
        super();

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

    async boot(config: object | string = null) {
        this.log.info("Boot qwiki")

        /*
         load configuration
         load module manager
         load other modules
         startup event
         */
        if (typeof config == "string") {

        }
    }
}
