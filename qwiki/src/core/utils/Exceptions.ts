export class RuntimeException extends Error {
    cause: Error

    constructor(message: string = "Runtime exception", cause: Error = undefined) {
        super(message);
        this.cause = cause;
    }
}

export class NotImplementedException extends RuntimeException {

    constructor(message: string = "Not Implemented", cause: Error = undefined) {
        super(message, cause);
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
