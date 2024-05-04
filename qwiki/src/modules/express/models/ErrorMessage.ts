class ErrorMessage {
    error: boolean
    message: string

    constructor(message: string) {
        this.message = message;
        this.error = true;
    }
}