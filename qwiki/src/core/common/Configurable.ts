import {ApplicationConfig} from "../models/ApplicationConfig";
import * as yaml from 'js-yaml';
import * as fs from "fs";

export interface Configurable {
    _configPath: string
    config: ApplicationConfig
    _reloadConfig: Function
}

export function initializeConfigurable(self: Configurable, configPath: string = "./application.yaml") {
    self._configPath = configPath;
    self._reloadConfig = function () {
        if (! fs.existsSync(self._configPath)) {
            throw new Error(`Configuration file not found: ${self._configPath}`)
        }
        self.config = <ApplicationConfig>yaml.load(fs.readFileSync(self._configPath, 'utf8'));
    }
    self._reloadConfig()
}


