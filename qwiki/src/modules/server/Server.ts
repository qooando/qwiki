import {Base} from "@qwiki/core/base/Base";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";

export class Server extends Base {

    constructor() {
        super();
    }

    async start(): Promise<void> {
        throw new Error(`Not implemented`)
    }

    async stop(): Promise<void> {
        throw new Error(`Not implemented`)
    }

}