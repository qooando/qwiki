export class RuntimeException extends Error {
    cause: Error

    constructor(message: string = "", cause: Error = undefined) {
        super(message);
        this.cause = cause;
    }
}