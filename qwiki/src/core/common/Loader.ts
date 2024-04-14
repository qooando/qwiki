import {Bean} from "./Bean";

export interface Loader extends Bean {
    supportedMimeTypes: Array<string>

    load(path: string): any;
}