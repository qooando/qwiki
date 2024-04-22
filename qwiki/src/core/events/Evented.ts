import {EventCallback, EventContext, EventManager} from "./EventManager";
import {Heap} from "../utils/Heap";

export interface LoggerConfig {
    nameSuffix?: string;
}

export interface Evented {
    _eventManager: EventManager
    on: Function
    emit: Function
}

export function initializeEvented(self: Evented) {
    self._eventManager = new EventManager()
    self.on = self._eventManager.on.bind(self._eventManager)
    self.emit = self._eventManager.emit.bind(self._eventManager)
}
