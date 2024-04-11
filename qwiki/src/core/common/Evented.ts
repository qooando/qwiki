import {EventCallback, EventContext, EventManager} from "../utils/EventManager";
import {Heap} from "../utils/Heap";

export interface LoggerConfig {
    nameSuffix?: string;
}

export interface Evented {
    _eventManager: EventManager
    on: Function
    emit: Function
    emitSync: Function
}

export function initializeEvented(self: Evented) {
    self._eventManager = new EventManager()
    self.on = self._eventManager.on
    self.emit = self._eventManager.emit
    self.emitSync = self._eventManager.emitSync
}
