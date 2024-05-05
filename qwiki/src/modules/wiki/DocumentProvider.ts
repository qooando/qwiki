import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/models/WikiDocument";
import * as fs from "node:fs";
import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {StorageService} from "@qwiki/modules/storage/StorageService";

export class DocumentProvider extends Base {

    declare supportedProtocols: string[];
    declare supportedMimetypes: string[];
    storageService = Autowire(StorageService);

    async read(url: URL): Promise<WikiDocument> {
        throw new Error(`Not implemented`);
    }

    async write(url: URL, document: WikiDocument): Promise<void> {
        throw new Error(`Not implemented`);
    }

    _urlToPath(url: URL, basePath: string = ""): string {
        let candidateFilePaths = [
            `${url.pathname}`,
            `.${url.pathname}`,
            `./${url.pathname}`,
            `${basePath}${url.pathname}`,
            `.${basePath}${url.pathname}`,
            `./${basePath}${url.pathname}`
        ]
        let filePaths = candidateFilePaths.filter(x => this.storageService.existsByPath(x));
        if (!filePaths.length) {
            throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
        }
        return fs.realpathSync(filePaths[0]);
    }
}

