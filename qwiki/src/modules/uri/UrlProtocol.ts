import {Base} from "@qwiki/core/base/Base";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

export class UrlProtocol extends Base {

    declare protocol: string;

    async save(url: URL, content: any) {
        throw new NotImplementedException();
    }

    async load(url: URL) {
        throw new NotImplementedException();
    }

    async exists(url: URL) {
        throw new NotImplementedException();
    }
}