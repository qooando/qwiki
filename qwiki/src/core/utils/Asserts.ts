export function assert(value: any, message: string = undefined) {
    if (!value) {
        throw new Error(message ?? "Assertion failed")
    }
}