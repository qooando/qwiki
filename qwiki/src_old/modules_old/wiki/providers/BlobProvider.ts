import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {DocumentProvider} from "@qwiki/modules/wiki/DocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "../../../../src/modules/wiki/persistence/models/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";
import {Value} from "@qwiki/core/beans/Value";
import * as fs from "node:fs";
import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "../../persistence/models/PermissiveURL";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

export class BlobProvider extends DocumentProvider {
    static __bean__: __Bean__ = {};

    supportedProtocols = [
        "blob"
    ];

    supportedMimetypes = [
        "application/octet-stream"
    ]

    async read(url: PermissiveURL): Promise<WikiDocument> {
        let contentPath = url.path;
        let rawContent = await this.storageService.read(contentPath);
        let doc = new WikiDocument({content: rawContent});
        // FIXME some metadata should be filled here
        return doc;
    }

    async write(url: PermissiveURL, document: WikiDocument): Promise<void> {
        throw new NotImplementedException();
        // let contentPath = url.path;
        // let rawContent = JSON.stringify({
        //     metadata: document.metadata, // FIXME some metadata should be filled here
        //     content: document.content
        // })
        // await this.storageService.write(contentPath, rawContent)
    }

}