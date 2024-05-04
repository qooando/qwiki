export class RuntimeException extends Error {
    cause: Error

    constructor(message: string = "", cause: Error = undefined) {
        super(message);
        this.cause = cause;
    }
}

export function getFullStackTrace(err: any): string {
    let result = err.stack
    err = err.cause;
    while(err) {
        result += "\nCause: " + err.stack;
        err = err.cause;
    }
    return result;
}
