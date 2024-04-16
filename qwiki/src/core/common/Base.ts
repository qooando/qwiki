import {initializeLogged, Logged} from "./Logged";
import pino from "pino";
import {Evented, initializeEvented} from "./Evented";
import {EventManager} from "../EventManager";

export class Base implements Logged, Evented {
    log: pino.Logger;
    _eventManager: EventManager;
    on: Function;
    emit: Function;
    emitSync: Function;

    constructor() {
        initializeLogged(this)
        initializeEvented(this)
    }

}
