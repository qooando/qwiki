export interface WikiDocumentMetadata {
    id?: string;
    title?: string;
    project?: string;
    tags?: string[];
    annotations?: Map<string, string>;
}