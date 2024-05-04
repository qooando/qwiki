import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as fs from "node:fs";

export class FilesStorageProvider extends StorageProvider {
    static __bean__: __Bean__ = {};

    get supportedProtocols(): string[] {
        return [
            "file"
        ];
    }

    async read(url: URL): Promise<string> {
        return fs.readFileSync(url.pathname, "utf-8");
    }

    async write(url: URL, content: string): Promise<void> {
        fs.writeFileSync(url.pathname, content, "utf-8");
    }
}