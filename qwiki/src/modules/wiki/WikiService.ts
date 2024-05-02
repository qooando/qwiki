import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiDocumentProvider} from "@qwiki/modules/wiki/WikiDocumentProvider";
import {WikiDocument} from "@qwiki/modules/wiki/WikiDocument";
import {Value} from "@qwiki/core/beans/Value";

export class WikiService extends Base {
    static __bean__: __Bean__ = {}

    documentProviders: Map<string, WikiDocumentProvider> = Autowire(
        [WikiDocumentProvider],
        (x: WikiDocumentProvider) => x.supportedProtocols,
        true
    );

    _getDocumentProvider(protocol: string) {
        if (!this.documentProviders.has(protocol)) {
            throw new Error(`Document provider not found: ${protocol}`)
        }
        return this.documentProviders.get(protocol);
    }

    // async readDocumentById(id: string): Promise<WikiDocument> {
    //     // FIXME
    // }
    //
    // async writeDocumentById(id: string, document: WikiDocument) {
    //     // FIXME
    // }

    async readDocumentByUrl(url: URL): Promise<WikiDocument> {
        return await this._getDocumentProvider(url.protocol).read(url);
    }

    async writeDocumentByUrl(url: URL, document: WikiDocument): Promise<void> {
        return await this._getDocumentProvider(url.protocol).write(url, document);
    }

}