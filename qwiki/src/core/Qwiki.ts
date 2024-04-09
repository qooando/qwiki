import {Base} from "./common/Base";

export class Qwiki extends Base {

    static Events: object = {
        CORE_BEFORE_INIT: "CORE_BEFORE_INIT",
        CORE_AFTER_INIT: "CORE_AFTER_INIT",
        STARTUP: "STARTUP",
        END: "END"
    }

    constructor() {
        super();
    }

    async boot(config: object|string = null) {
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
