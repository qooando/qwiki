export class ErrorDto {
    error: boolean
    message: string

    constructor(message: string) {
        this.message = message;
        this.error = true;
    }
}

export class WikiDocumentNotFoundErrorDto extends ErrorDto {
    document: string

    constructor(message: string, document: string) {
        super(message)
        this.document = document;
    }
}