import {RuntimeException} from "@qwiki/core/utils/Exceptions";

export class WikiException extends RuntimeException {
}

export class WikiDocumentException extends WikiException {
}

export class WikiDocumentProcessingException extends WikiDocumentException {
}

export class WikiDocumentIOException extends WikiDocumentException {
}

export class WikiDocumentReadException extends WikiDocumentIOException {
}

export class WikiDocumentWriteException extends WikiDocumentIOException {
}

export class WikiDocumentNotFoundException extends WikiDocumentIOException {
}
