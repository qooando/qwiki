
export interface LoggerConfig {
    nameSuffix?: string;
}

export interface Evented {
    // _callbacks: Map<string, Array<Function>>
}

export function $events(self: Evented, options: LoggerConfig = {}) {
    // options = Object.assign({
    //     nameSuffix: null
    // }, options)
    // const loggerName = self.constructor.name + (options.nameSuffix ? `|${options.nameSuffix}` : "");
    // self.log ??= pinoMainLogger.child({
    //     name: loggerName
    // })
}
