import {Base} from "@qwiki/core/base/Base";

export class Server extends Base {

    name: string

    constructor(config: any = {}) {
        super({
            nameSuffix: config.name
        });
        this.name = config.name ?? this.constructor.name;
    }

    async start(): Promise<void> {
        throw new Error(`Not implemented`)
    }

    async stop(): Promise<void> {
        throw new Error(`Not implemented`)
    }

}