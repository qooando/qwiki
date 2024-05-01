import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {WikiDocumentProvider} from "@qwiki/modules/wiki/WikiDocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "@qwiki/modules/wiki/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";

export class JsonWikiDocumentProvider extends WikiDocumentProvider {
    static __bean__: __Bean__ = {};

    storageProvider: FilesStorageProvider = Autowire(FilesStorageProvider);

    supportedProtocols: [
        "json-file"
    ];

    async read(url: URL): Promise<WikiDocument> {
        let rawUrl = new URL(url)
        rawUrl.protocol = "file"
        let rawContent = await this.storageProvider.read(rawUrl)
        let jsonContent = JSON.parse(rawContent);
        let doc = new WikiDocument();
        doc.content = jsonContent.content;
        doc.metadata = jsonContent.metadata;
        return doc;
    }

    async write(url: URL, document: WikiDocument): Promise<void> {
        let rawUrl = new URL(url);
        rawUrl.protocol = "file";
        let rawContent = JSON.stringify({
            metadata: document.metadata,
            content: document.content
        })
        await this.storageProvider.write(rawUrl, rawContent)
    }

}