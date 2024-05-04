import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/WikiDocument";

export class WikiDocumentProvider extends Base {

    declare supportedProtocols: string[];

    async read(url: URL): Promise<WikiDocument> {
        throw new Error(`Not implemented`);
    }

    async write(url: URL, document: WikiDocument): Promise<void> {
        throw new Error(`Not implemented`);
    }

}

