import {initializeLogged, Logged, LoggerConfig} from "./Logged";
import pino from "pino";
import {Evented, initializeEvented} from "../events/Evented";
import {EventCallback, EventManager} from "../events/EventManager";

export class Base implements Logged, Evented {
    log: pino.Logger;
    _eventManager: EventManager;
    on: Function;
    emit: Function;

    constructor(logOptions: LoggerConfig = {}) {
        initializeLogged(this, logOptions)
        initializeEvented(this)
    }

}
