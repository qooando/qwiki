import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {DocumentProvider} from "@qwiki/modules/wiki/DocumentProvider";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocument} from "../../../../src/modules/wiki/persistence/WikiDocument";
import {FilesStorageProvider} from "@qwiki/modules/storage/providers/FilesStorageProvider";
import {Value} from "@qwiki/core/beans/Value";
import * as fs from "node:fs";
import {WikiDocumentException, WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {JsonProvider} from "@qwiki/modules/wiki/providers/JsonProvider";
import {mime} from "@qwiki/core/utils/Mime";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import {YamlProvider} from "@qwiki/modules/wiki/providers/YamlProvider";
import {StorageService} from "@qwiki/modules/storage/StorageService";
import {PermissiveURL} from "../../persistence/models/PermissiveURL";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

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

    jsonProvider = Autowire(JsonProvider);
    yamlProvider = Autowire(YamlProvider);

    defaultSearchPaths = [
        "wikis",
    ]

    async read(url: PermissiveURL): Promise<WikiDocument> {
        // NOTE: url path MUST ALWAYS BE relative to storage root
        let validUrl = this._findValidUrl(url, this.defaultSearchPaths);
        let mimetype = mime.getType(validUrl.path);
        switch (mimetype) {
            case MediaType.TEXT_MARKDOWN:
                // FIXME
                throw new NotImplementedException();
            case MediaType.APPLICATION_JSON:
                return await this.jsonProvider.read(validUrl);
            case MediaType.APPLICATION_YAML:
                return await this.yamlProvider.read(validUrl);
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