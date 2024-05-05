import {Base} from "@qwiki/core/base/Base";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import {PermissiveURL} from "@qwiki/modules/storage/models/PermissiveURL";

export class StorageProvider extends Base {

    declare supportedProtocols: string[];

    async read(url: PermissiveURL): Promise<string> {
        throw new NotImplementedException();
    }

    async write(url: PermissiveURL, content: string): Promise<void> {
        throw new NotImplementedException();
    }

    exists(url: PermissiveURL): boolean {
        throw new NotImplementedException();
    }

    realpath(url: PermissiveURL): PermissiveURL {
        throw new NotImplementedException();
    }

}

