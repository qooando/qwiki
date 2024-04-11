import pino from "pino";

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
    const loggerName = self.constructor.name + (options.nameSuffix ? `|${options.nameSuffix}` : "");
    self.log ??= pinoMainLogger.child({
        name: loggerName
    })
}
