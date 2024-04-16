export interface Loader {
    supportedMimeTypes: Array<string>

    load(path: string): any;
}