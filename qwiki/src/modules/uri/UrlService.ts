import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {UrlProtocol} from "@qwiki/modules/uri/UrlProtocol";

export class UrlService extends Base {
    static __bean__: __Bean__ = {}

    protocols = Autowire(
        [UrlProtocol],
        undefined,
        (x: UrlProtocol) => x.protocol
    )

    async postConstruct() {
        this.log.debug(`Supported URL protocols: ${[...this.protocols.keys()]}`)
    }

    async save(url: URL, content: any) {
        return await this.protocols.get(url.protocol).save(url, content);
    }

    async load(url: URL) {
        return await this.protocols.get(url.protocol).load(url);
    }

    async exists(url: URL) {
        return await this.protocols.get(url.protocol).exists(url);
    }

}