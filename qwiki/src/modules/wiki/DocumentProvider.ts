import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/models/WikiDocument";
import * as fs from "node:fs";
import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "@qwiki/modules/storage/models/PermissiveURL";

export class DocumentProvider extends Base {

    declare supportedProtocols: string[];
    declare supportedMimetypes: string[];
    storageService = Autowire(StorageService);

    async read(url: PermissiveURL): Promise<WikiDocument> {
        throw new Error(`Not implemented`);
    }

    async write(url: PermissiveURL, document: WikiDocument): Promise<void> {
        throw new Error(`Not implemented`);
    }

    _normalizeUrl(url: PermissiveURL, searchPaths: string[] = []): PermissiveURL {
        let candidateUrls = [
            url,
            ...searchPaths.map(x => {
                let u = new PermissiveURL(url);
                u.path = x + u.path;
                return u;
            })
        ];
        let existingUrls = candidateUrls.filter(x => this.storageService.exists(x));
        if (!existingUrls.length) {
            throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
        }
        return this.storageService.realpath(existingUrls[0]);
    }

    _urlToPath(url: PermissiveURL, basePath: string = ""): string {
        return this._normalizeUrl(url).path;
    }
}

