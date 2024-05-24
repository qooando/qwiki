// import {EventCallback, EventContext, EventManager} from "./EventManager";
import {EventEmitter} from "events";
import {Heap} from "../utils/Heap";

export interface LoggerConfig {
    nameSuffix?: string;
}

export interface Evented {
    _eventManager: EventEmitter
    on: Function
    emit: Function
    once: Function
}

export function initializeEvented(self: Evented) {
    self._eventManager = new EventEmitter();
    self.on = self._eventManager.on.bind(self._eventManager)
    self.emit = self._eventManager.emit.bind(self._eventManager)
    self.once = self._eventManager.once.bind(self._eventManager)
}
