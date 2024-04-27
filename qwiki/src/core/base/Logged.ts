import pino from "pino";
import {__Bean__} from "@qwiki/core/beans/__Bean__";

var pinoMainLogger = require("pino")({
    level: "debug",
    // sync: false, // Asynchronous logging
    formatters: {
        bindings: function (bindings: any) {
            return {
                // pid: bindings.pid,
                // hostname: bindings.hostname,
                name: bindings.name
            };
        },
    },
    transport: { // https://github.com/pinojs/pino-pretty/blob/master/Readme.md
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    },
});

export interface LoggerConfig {
    nameSuffix?: string;
}

export interface Logged {
    log: pino.Logger;

}

export function initializeLogged(self: Logged, options: LoggerConfig = {}) {
    options = Object.assign({
        nameSuffix: null
    }, options)
    const loggerName = (("__bean__" in self.constructor ? (self.constructor.__bean__ as __Bean__).name : undefined) ?? self.constructor.name) + (options.nameSuffix ? `|${options.nameSuffix}` : "");
    self.log ??= pinoMainLogger.child({
        name: loggerName
    })
}
