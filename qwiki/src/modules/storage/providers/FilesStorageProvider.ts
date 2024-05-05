import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as fs from "node:fs";
import {Value} from "@qwiki/core/beans/Value";

export class FilesStorageProvider extends StorageProvider {
    static __bean__: __Bean__ = {};

    supportedProtocols = [
        "file"
    ];

    basePath = Value("qwiki.wiki.storages.protocols.file.localPath", ".");

    _urlToPath(url: URL) {
        return `${this.basePath}${url.pathname}`;
    }

    async read(url: URL): Promise<string> {
        return fs.readFileSync(this._urlToPath(url), "utf-8");
    }

    async write(url: URL, content: string): Promise<void> {
        fs.writeFileSync(this._urlToPath(url), content, "utf-8");
    }

    exists(url: URL): boolean {
        return fs.existsSync(this._urlToPath(url));
    }
}