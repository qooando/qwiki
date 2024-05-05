import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";
import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {Value} from "@qwiki/core/beans/Value";

export class StorageService extends Base {
    static __bean__: __Bean__ = {};

    defaultProtocol = Value("qwiki.wiki.storages.defaultProtocol", "file");

    storages: Map<string, StorageProvider> = Autowire(
        [StorageProvider],
        null,
        // (x: StorageProvider) => this.enabledStorages.length === 0 || this.enabledStorages.includes(x.constructor.name),
        (x: StorageProvider) => x.supportedProtocols
    );

    async postConstruct() {
        this.log.debug(`Available storage protocols: ${[...this.storages.keys()]}`)
        this.log.debug(`Default storage protocol: ${this.defaultProtocol}`);
        // this.log.debug(this.storages)
    }

    async readByUrl(url: URL): Promise<string> {
        let protocol = url.protocol.replace(":", "");
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        let storage = this.storages.get(protocol);
        return await storage.read(url);
    }

    async writeByUrl(url: URL, content: string): Promise<void> {
        let protocol = url.protocol.replace(":", "");
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        let storage = this.storages.get(protocol);
        return await storage.write(url, content);
    }

    async readByPath(p: string): Promise<string> {
        return await this.readByUrl(new URL(`${this.defaultProtocol}:${p}`));
    }

    existsByUrl(url: URL): boolean {
        let protocol = url.protocol.replace(":", "");
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        let storage = this.storages.get(protocol);
        return storage.exists(url);
    }

    async writeByPath(p: string, content: string): Promise<void> {
        return await this.writeByUrl(new URL(`${this.defaultProtocol}:${p}`), content);
    }

    existsByPath(p: string): boolean {
        return this.existsByUrl(new URL(`${this.defaultProtocol}:${p}`));
    }
}

