import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";
import * as fs from "node:fs";
import {PermissiveURL} from "@qwiki/modules/storage/models/PermissiveURL";

export class FilesStorageProvider extends StorageProvider {
    static __bean__: __Bean__ = {};

    supportedProtocols = [
        "file"
    ];

    searchPaths = Value("qwiki.wiki.storages.protocols.file.searchPaths", ["."]);

    protected _urlToPath(url: PermissiveURL, searchPaths: [] = undefined): string {
        return this._findValidUrl(url, searchPaths ?? this.searchPaths).path
    }

    async read(url: PermissiveURL): Promise<string> {
        return fs.readFileSync(this._urlToPath(url), "utf-8");
    }

    async write(url: PermissiveURL, content: string): Promise<void> {
        fs.writeFileSync(this._urlToPath(url), content, "utf-8");
    }

    _exists(url: PermissiveURL): boolean {
        return fs.existsSync(url.path);
    }

    exists(url: PermissiveURL): boolean {
        return fs.existsSync(this._urlToPath(url));
    }

}