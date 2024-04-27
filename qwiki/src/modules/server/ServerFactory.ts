import {Base} from "@qwiki/core/base/Base";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";
import {Bean} from "@qwiki/core/beans/Bean";

export class ServerFactory extends Base {

    constructor() {
        super();
    }

    getBean(config: {}): Bean {
        throw new Error("Not implemented");
    }

}