import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";
import {StorageProvider} from "@qwiki/modules/storage/StorageProvider";
import {Value} from "@qwiki/core/beans/Value";
import {PermissiveURL} from "@qwiki/modules/storage/models/PermissiveURL";

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

    _normalizeUrl(url: PermissiveURL | string): PermissiveURL {
        if (typeof url === "string") {
            url = new PermissiveURL(`${this.defaultProtocol}:${url}`) ;
        }
        return url;
    }

    _getStorageProvider(url: PermissiveURL | string) {
        url = this._normalizeUrl(url) as PermissiveURL;
        let protocol = url.scheme;
        if (!this.storages.has(protocol)) {
            throw new Error(`Not implemented protocol: ${protocol}`)
        }
        return this.storages.get(protocol);
    }

    async read(url: PermissiveURL | string): Promise<string> {
        url = this._normalizeUrl(url);
        let storage = this._getStorageProvider(url);
        return await storage.read(url);
    }

    async write(url: PermissiveURL | string, content: string): Promise<void> {
        url = this._normalizeUrl(url);
        let storage = this._getStorageProvider(url)
        return await storage.write(url, content);
    }

    exists(url: PermissiveURL | string): boolean {
        url = this._normalizeUrl(url);
        let storage = this._getStorageProvider(url);
        return storage.exists(url);
    }

    realpath(url: PermissiveURL | string): PermissiveURL {
        url = this._normalizeUrl(url);
        let storage = this._getStorageProvider(url)
        return storage.realpath(url);
    }
}

