import {$log, Logged} from "./Logged";
import pino from "pino";
import {$events, Evented} from "./Evented";

export class Base implements Logged, Evented {
    constructor() {
        $log(this)
    }

    log: pino.Logger;
}
