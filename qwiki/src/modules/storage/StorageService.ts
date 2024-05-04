import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";
import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";

export class StorageService extends Base {
    static __bean__: __Bean__ = {}

    storages: Map<string, StorageProvider> = Autowire(
        [StorageProvider],
        undefined,
        (x: StorageProvider) => x.supportedProtocols
    );

    async postConstruct() {
        // this.log.debug(this.storages)
    }

    async read(url: URL): Promise<string> {
        let protocol = url.protocol;
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        let storage = this.storages.get(protocol);
        return await storage.read(url);
    }

    async write(url: URL, content: string): Promise<void> {
        let protocol = url.protocol;
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        let storage = this.storages.get(protocol);
        return await storage.write(url, content);
    }


}

