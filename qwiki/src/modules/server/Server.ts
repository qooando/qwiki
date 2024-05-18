import {Base} from "@qwiki/core/base/Base";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";

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