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
import {PermissiveURL} from "@qwiki/modules/persistence/models/PermissiveURL";

export class WikiService extends Base {
    static __bean__: __Bean__ = {}

    /*
    FIXME, this service should be a generic persistence proxy.
    It should be implement:
        - crud: create, read, update, delete
        - indexing

     It should leverage underlying WikiService implementation
     selected by an option in application.yaml (e.g. use local file storage)

     WikiService (document (data + metadata), crud, indexing)

     Persistence (blob, rud, indexing)

     Storage (save/write blobs in a specific position, no indexing)

     example:

     FileStorage: read/write files in filesystem

     Persistence:
        find( ... )
        findOne( ... )
        write( ... )


     */

    // documentProviders: Map<string, DocumentProvider> = Autowire(
    //     [DocumentProvider],
    //     undefined,
    //     (x: DocumentProvider) => {
    //         return x.supportedProtocols;
    //     }
    // );

    async postConstruct() {
        // if (this.documentProviders.size === 0) {
        //     this.log.warn(`No WikiDocumentProvider found`);
        // }
    }

    // _getDocumentProvider(protocol: string) {
    //     if (!this.documentProviders.has(protocol)) {
    //         throw new Error(`Document provider not found: ${protocol}`)
    //     }
    //     return this.documentProviders.get(protocol);
    // }
    //
    // async readDocumentById(id: string): Promise<WikiDocument> {
    //     // FIXME
    // }
    //
    // async writeDocumentById(id: string, document: WikiDocument) {
    //     // FIXME
    // }
    //
    // async readDocument(url: PermissiveURL): Promise<WikiDocument> {
    //     try {
    //         return await this._getDocumentProvider(url.scheme).read(url);
    //     } catch (e) {
    //         if (e instanceof WikiDocumentException) {
    //             throw e;
    //         }
    //         throw new WikiDocumentException(`Cannot read document: ${url}`, url.toString(), e);
    //     }
    // }
    //
    // async writeDocumentByUrl(url: PermissiveURL, document: WikiDocument): Promise<void> {
    //     try {
    //         return await this._getDocumentProvider(url.scheme).write(url, document);
    //     } catch (e) {
    //         if (e instanceof WikiDocumentException) {
    //             throw e;
    //         }
    //         throw new WikiDocumentException(`Cannot write document: ${url}`, url.toString(), e);
    //     }
    // }

}