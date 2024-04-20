export interface ILoader {
    supportedMimeTypes: Array<string>
    load(path: string): any;
}