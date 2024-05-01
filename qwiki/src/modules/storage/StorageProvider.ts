import {Base} from "@qwiki/core/base/Base";

export class StorageProvider extends Base {

    supportedProtocols: string[] = [];

    async read(url: URL): Promise<string> {
        throw new Error(`Not implemented`);
    }

    async write(url: URL, content: string): Promise<void> {
        throw new Error(`Not implemented`);
    }

}

