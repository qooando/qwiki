import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "../../../src/modules/wiki/persistence/models/WikiDocument";
import * as fs from "node:fs";
import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "../persistence/models/PermissiveURL";

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

    _findValidUrl(url: PermissiveURL, searchPaths: string[] = undefined): PermissiveURL {
        if (!searchPaths || !searchPaths.length) {
            if (this.storageService.exists(url)) {
                return url;
            }
            throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
        }
        let validUrl = searchPaths
            .map(prefix => url.withPathPrefix(prefix))
            .filter(url => this.storageService.exists(url.withoutScheme()))[0];
        if (!validUrl) {
            throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
        }
        return validUrl;
    }

}

