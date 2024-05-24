import {initializeLogged, Logged, LoggerConfig} from "./Logged";
import pino from "pino";
import {Evented, initializeEvented} from "../events/Evented";
import {EventEmitter} from "events";

export class Base implements Logged, Evented {
    log: pino.Logger;
    _eventManager: EventEmitter;
    on: Function;
    once: Function;
    emit: Function;

    constructor(logOptions: LoggerConfig = {}) {
        initializeLogged(this, logOptions)
        initializeEvented(this)
    }

}
