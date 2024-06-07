import {initializeLogged, Logged, LoggerConfig} from "./Logged";
import pino from "pino";
import {Evented, initializeEvented} from "../events/Evented";
import {EventEmitter} from "events";
import {EventManagerAlike} from "@qwiki/core/events/EventManager";

export class Base implements Logged, Evented {
    log: pino.Logger;
    _eventManager: EventManagerAlike;
    on: Function;
    once: Function;
    emit: Function;

    constructor(logOptions: LoggerConfig = {}) {
        initializeLogged(this, logOptions)
        initializeEvented(this)
    }

}
