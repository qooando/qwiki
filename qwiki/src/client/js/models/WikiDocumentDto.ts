// export interface WikiDocumentMetadata {
//     url: URL;
//     timestamp: Date;
//     author: string;
//     previousVersions?: Map<Date, URL>;
// }

export class WikiDocumentDto {
    // metadata: WikiDocumentMetadata
    metadata: any
    content: any

    constructor(data: any = {}) {
        Object.assign(this, data);
    }
}

