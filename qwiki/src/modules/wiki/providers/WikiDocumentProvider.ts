import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {DocumentProvider} from "@qwiki/modules/wiki/DocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "@qwiki/modules/wiki/models/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";
import {Value} from "@qwiki/core/beans/Value";
import * as fs from "node:fs";
import {WikiDocumentException, WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {JsonDocumentProvider} from "@qwiki/modules/wiki/providers/JsonDocumentProvider";
import {mime} from "@qwiki/core/utils/Mime";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import {YamlDocumentProvider} from "@qwiki/modules/wiki/providers/YamlDocumentProvider";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "@qwiki/modules/storage/models/PermissiveURL";

export class WikiDocumentProvider extends DocumentProvider {
    static __bean__: __Bean__ = {};

    supportedProtocols = [
        "wiki"
    ];

    supportedMimetypes = [
        "application/json",
        "application/yaml",
        "text/markdown"
    ]

    jsonProvider = Autowire(JsonDocumentProvider);
    yamlProvider = Autowire(YamlDocumentProvider);

    async read(url: PermissiveURL): Promise<WikiDocument> {
        let filePath = this._urlToPath(url, "wikis");
        let mimetype = mime.getType(filePath);
        switch (mimetype) {
            case MediaType.TEXT_MARKDOWN:
                // FIXME implement this
                throw new Error("Not implemented");
            case MediaType.APPLICATION_JSON:
                return await this.jsonProvider.read(url);
            case MediaType.APPLICATION_YAML:
                return await this.yamlProvider.read(url);
            default:
                throw new WikiDocumentException(`No document provider found for mimetype ${mimetype}: ${url}`, url.toString());
        }

    }

    async write(url: PermissiveURL, document: WikiDocument): Promise<void> {
        // FIXME
        throw new Error(`Not implemented`)
        // let rawUrl = new URL(`file:${url.pathname.replace(/^(${this.storageLocalPath})/gi, "")}`)
        // let rawContent = JSON.stringify({
        //     metadata: document.metadata, // FIXME some metadata should be filled here
        //     content: document.content
        // })
        // await this.storageProvider.write(rawUrl, rawContent)
    }

}