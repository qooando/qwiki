import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {DocumentProvider} from "@qwiki/modules/wiki/DocumentProvider";
import {WikiDocument} from "@qwiki/modules/wiki/models/WikiDocument";
import {Value} from "@qwiki/core/beans/Value";
import {RuntimeException} from "@qwiki/core/utils/Exceptions";
import {
    WikiDocumentException,
    WikiDocumentIOException,
    WikiDocumentProcessingException
} from "@qwiki/modules/wiki/WikiExceptions";

export class WikiService extends Base {
    static __bean__: __Bean__ = {}

    documentProviders: Map<string, DocumentProvider> = Autowire(
        [DocumentProvider],
        undefined,
        (x: DocumentProvider) => {
            return x.supportedProtocols;
        }
    );

    async postConstruct() {
        if (this.documentProviders.size === 0) {
            this.log.warn(`No WikiDocumentProvider found`);
        }
    }

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
        try {
            return await this._getDocumentProvider(url.protocol.replace(":", "")).read(url);
        } catch (e) {
            if (e instanceof WikiDocumentException) {
                throw e;
            }
            throw new WikiDocumentException(`Cannot read document: ${url}`, url.toString(), e);
        }
    }

    async writeDocumentByUrl(url: URL, document: WikiDocument): Promise<void> {
        try {
            return await this._getDocumentProvider(url.protocol.replace(":", "")).write(url, document);
        } catch (e) {
            if (e instanceof WikiDocumentException) {
                throw e;
            }
            throw new WikiDocumentException(`Cannot write document: ${url}`, url.toString(), e);
        }
    }

}