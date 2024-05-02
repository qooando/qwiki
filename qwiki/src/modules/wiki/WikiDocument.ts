export interface WikiDocumentMetadata {
    url: URL;
    timestamp: Date;
    author: string;
    previousVersions?: Map<Date, URL>;
}

export class WikiDocument {
    metadata: WikiDocumentMetadata
    content: any

    constructor(data: any = {}) {
        Object.apply(this, data);
    }
}

