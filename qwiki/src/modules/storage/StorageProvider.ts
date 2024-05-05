import {Base} from "@qwiki/core/base/Base";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

export class StorageProvider extends Base {

    declare supportedProtocols: string[];

    async read(url: URL): Promise<string> {
        throw new NotImplementedException();
    }

    async write(url: URL, content: string): Promise<void> {
        throw new NotImplementedException();
    }

    exists(url: URL): boolean {
        throw new NotImplementedException();
    }

}

