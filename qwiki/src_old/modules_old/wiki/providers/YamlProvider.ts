import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {DocumentProvider} from "@qwiki/modules/wiki/DocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "@qwiki/modules/wiki/models/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";
import {Value} from "@qwiki/core/beans/Value";
import * as fs from "node:fs";
import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import * as yaml from "js-yaml";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "@qwiki/modules/persistence/models/PermissiveURL";

export class YamlProvider extends DocumentProvider {
    static __bean__: __Bean__ = {};

    storageProvider: FilesStorageProvider = Autowire(FilesStorageProvider);
    storageLocalPath = Value("qwiki.wiki.storages.protocols.file.localPath", "./data")

    supportedProtocols = [
        "yaml"
    ];

    supportedMimetypes = [
        "application/yaml"
    ]

    async read(url: PermissiveURL): Promise<WikiDocument> {
        let contentPath = url.path;
        let rawContent = await this.storageService.read(contentPath);
        let content = yaml.load(rawContent);
        let doc = new WikiDocument(content);
        // FIXME some metadata should be filled here
        return doc;
    }

    async write(url: PermissiveURL, document: WikiDocument): Promise<void> {
        let contentPath = url.path;
        let rawContent = yaml.dump({
            metadata: document.metadata, // FIXME some metadata should be filled here
            content: document.content
        })
        await this.storageService.write(contentPath, rawContent)
    }

}