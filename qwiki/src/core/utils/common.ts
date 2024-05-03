import * as Module from "node:module";

const _require = Module.createRequire(import.meta.url);

export function require(path: string) {
    return _require(path);
}

export function assert(value: any, message: string = undefined) {
    if (!value) {
        throw new Error(message ?? "Assertion failed")
    }
}