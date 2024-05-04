import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {WikiDocumentProvider} from "@qwiki/modules/wiki/WikiDocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "@qwiki/modules/wiki/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";
import {Value} from "@qwiki/core/beans/Value";

export class JsonWikiDocumentProvider extends WikiDocumentProvider {
    static __bean__: __Bean__ = {};

    storageProvider: FilesStorageProvider = Autowire(FilesStorageProvider);
    storageLocalPath = Value("qwiki.wiki.storages.files.localPath", "./data")

    supportedProtocols = [
        "json-file"
    ];

    async read(url: URL): Promise<WikiDocument> {
        let rawUrl = new URL(`json-file:${this.storageLocalPath}${url.pathname}`)
        let rawContent = await this.storageProvider.read(rawUrl)
        let jsonContent = JSON.parse(rawContent);
        let doc = new WikiDocument(jsonContent);
        // FIXME some metadata should be filled here
        return doc;
    }

    async write(url: URL, document: WikiDocument): Promise<void> {
        let rawUrl = new URL(`file:${url.pathname.replace(/^(${this.storageLocalPath})/gi, "")}`)
        let rawContent = JSON.stringify({
            metadata: document.metadata, // FIXME some metadata should be filled here
            content: document.content
        })
        await this.storageProvider.write(rawUrl, rawContent)
    }

}