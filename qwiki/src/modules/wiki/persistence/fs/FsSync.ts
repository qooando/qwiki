import {FilesRepository} from "@qwiki/modules/persistence-files/FilesRepository";
import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import {INotifyWaitEvents} from "@qwiki/modules/inotifywait/INotifyWait";
import * as path from "node:path";
import * as fs from "node:fs";
import {glob} from "glob";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {
    WikiDocumentRepository,
    WikiDocumentRepositoryEvents
} from "@qwiki/modules/wiki/persistence/WikiDocumentRepository";
import {FsLoader} from "@qwiki/modules/wiki/persistence/fs/FsLoader";
import {detectFile, MediaType} from "@qwiki/core/utils/MediaTypes";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";

export class FsSync extends Base {
    static __bean__: __Bean__ = {
        loadCondition: () => ($qw.config.qwiki as any).applications.wiki.fsSync.enable
    }
    syncSubPath: string = Value("qwiki.applications.wiki.fsSync.subPath", "");
    absSyncBasePath: string;

    filesRepository = Autowire(FilesRepository);
    fileLastAccess: Map<String, number> = new Map();
    wikiRepository = Autowire(WikiDocumentRepository);

    fsLoadersByMediaType = Autowire(
        [FsLoader],
        undefined,
        (x: FsLoader) => x.mediaTypes
    );

    ignoreFileExtensions: string[];
    ignoreFileExtensionsRegExp: RegExp;

    async postConstruct() {
        const self = this;
        this.absSyncBasePath = path.join(process.cwd(), this.filesRepository.basePath, this.syncSubPath)
        this.ignoreFileExtensions = [...this.fsLoadersByMediaType.values()].flatMap(x => x.ignoreFileExtensions ?? []);
        this.ignoreFileExtensionsRegExp = new RegExp("\.(" + this.ignoreFileExtensions.join("|") + ")$");
        this.log.debug(`Sync database → filesystem`)
        await this.syncDbToFiles();
        this.log.debug(`Sync filesystem → database`)
        await this.syncFilesToDb();
        this.log.debug(`Sync on database events → filesystem`)
        this.wikiRepository.on(WikiDocumentRepositoryEvents.ALL, this.onDbEvent.bind(this));
        this.log.debug(`Sync on filesystem events → database`)
        this.filesRepository.watcher.on(INotifyWaitEvents.ALL, this.onFileEvent.bind(this));
    }

    async _getMediaTypeAndFsLoader(absPath: string): Promise<[string, FsLoader]> {
        const mediaType: string = await detectFile(absPath);
        const fsLoader: FsLoader =
            this.fsLoadersByMediaType.get(mediaType) ??
            this.fsLoadersByMediaType.get(MediaType.ANY);
        return [mediaType, fsLoader];
    }

    async _withFileLock(absPath: string, cb: () => Promise<any>) {
        if (await this.filesRepository.lockFile(absPath)) {
            try {
                return await cb();
            } finally {
                await this.filesRepository.unlockFile(absPath);
            }
        }
    }

    async loadFile(absPath: string, then: (absPath: string, doc: WikiDocument) => Promise<void> = undefined): Promise<WikiDocument> {
        return await this._withFileLock(absPath, async () => {
            const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(absPath);
            const doc = await fsLoader.load(absPath);
            if (then) {
                await then(absPath, doc);
            }
            return doc;
        });
    }

    async saveFile(absPath: string, doc: WikiDocument, then: (absPath: string, doc: WikiDocument) => Promise<void> = undefined) {
        return await this._withFileLock(absPath, async () => {
            const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(absPath);
            await fsLoader.save(absPath, doc);
            if (then) {
                await then(absPath, doc);
            }
            return doc;
        });
    }

    async onMovedFile(fromAbsPath: string, toAbsPath: string,
                      then: (fromAbsPath: string, toAbsPath: string, doc: WikiDocument) => Promise<void> = undefined) {
        // we assume toAbsPath exists
        return await this._withFileLock(toAbsPath, async () => {
            const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(toAbsPath);
            const doc = await fsLoader.onMoved(fromAbsPath, toAbsPath);
            if (then) {
                await then(fromAbsPath, toAbsPath, doc);
            }
            return doc;
        });
    }

    async onDeletedFile(absPath: string, then: (absPath: string) => Promise<void> = undefined): Promise<void> {
        return await this._withFileLock(absPath, async () => {
            const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(absPath);
            const doc = await fsLoader.onDeleted(absPath);
            if (then) {
                await then(absPath);
            }
            return doc;
        });
    }

    _getRelAbsPaths(genericPath: string): [string, string] {
        if (path.isAbsolute(genericPath)) {
            return [path.relative(this.absSyncBasePath, genericPath), genericPath];
        } else {
            // genericPath = path.join(process.cwd(), genericPath);
            // return [path.relative(this.absSyncBasePath, genericPath), genericPath];
            return [genericPath, path.join(this.absSyncBasePath, genericPath)];
        }
    }

    async onDbEvent(event: WikiDocumentRepositoryEvents, doc?: WikiDocument) {
        if (doc.mediaType == null) {
            this.log.warn(`Document mediaType is null: ${doc._id}`);
            return;
        }
        // FIXME transform title to a better filename
        let [relPath, absPath] = this._getRelAbsPaths(doc.contentPath);
        switch (event) {
            case WikiDocumentRepositoryEvents.UPDATE:
                /*
                 * A document was added or updated,
                 * 1. save the content to file
                 * 2. update the document on db again if the saveFile
                 *    changed something in the doc (e.g. contentPath)
                 */
                await this.saveFile(absPath, doc, doc.contentPath ? undefined :
                    async (absPath: string, doc: WikiDocument) => {
                        doc.contentPath = relPath;
                        await this.wikiRepository.upsert(doc, false);
                    });
                break;
            case WikiDocumentRepositoryEvents.DELETE:
            case WikiDocumentRepositoryEvents.TRASH:
                /*
                 * if a document is removed or trashed
                 * 1. remove the relative file
                 */
                await this.onDeletedFile(absPath);
                break;
        }

        return;
    }

    async onFileEvent(event: INotifyWaitEvents, filePath: string, stats: any) {
        // avoid to manage unwanted files
        if (this.ignoreFileExtensionsRegExp.test(filePath)) return;
        // filepath is relative to process.cwd()
        filePath = path.join(process.cwd(), filePath);
        let [relPath, absPath] = this._getRelAbsPaths(filePath);
        switch (event) {
            case INotifyWaitEvents.MOVE_TO:
                /*
                 * Custom INotifyWait wrapper use cookie to track when a file is moved
                 * WITHIN the same watched path, then it sets the previous file path
                 * as stats.from field.
                 */
                if (stats.from) {
                    /*
                     * If the from field is set, then the file was moved from a path
                     * WITHIN the watched folder to another path WITHIN the watched folder
                     * thus we must call the MOVED filed method, useful if the FsLoader
                     * has side effects about the file itself (e.g. FsLoaderAny saves metadata
                     * in a separate file)
                     *
                     * FIXME we don't manage changes in FsLoader, e.g. test.json -> test.css ???
                     */
                    await this.onMovedFile(stats.from, absPath,
                        async (fromAbsPath: string, toAbsPath: string, doc: WikiDocument) => {
                            doc = await this.wikiRepository.upsert(doc, false);
                        });
                } else {
                    /*
                     * If the from field is not set, then we assume the file was moved from an OUTSIDE
                     * path to a WATCHED path, thus we threat it as a new file.
                     */
                    await this.onFileEvent(INotifyWaitEvents.CHANGE, absPath, stats);
                }
                break;
            case INotifyWaitEvents.CREATE:
            case INotifyWaitEvents.CHANGE:
                /*
                 * Antiloop, avoid to manage a file with timestamp >= current time
                 * e.g. save on a file can trigger another save on the same file
                 */
                if (fs.existsSync(absPath)) {
                    let mtime = fs.statSync(absPath).mtimeMs;
                    if (this.fileLastAccess.has(absPath) &&
                        this.fileLastAccess.get(absPath) >= mtime) {
                        break;
                    }
                }
                /*
                 * When a file is created or changes its content
                 * 1. reload the file content and create a new WikiDocument object from it
                 * 2. upsert the new doc to db
                 * 3. save again to file changes provided by db (e.g. metadata)
                 * 4. blacklist the save timestamp to avoid loop trigger of this method
                 */
                // load the document and upsert
                await this.loadFile(absPath, async (absPath: string, doc: WikiDocument) => {
                    doc = await this.wikiRepository.upsert(doc, false);
                    const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(absPath);
                    await fsLoader.save(absPath, doc);
                    this.fileLastAccess.set(absPath, fs.statSync(absPath).mtimeMs);
                });
                break;
            case INotifyWaitEvents.MOVE_FROM:
                /*
                 * If a file is moved OUT, flag it on db
                 */
                await this.wikiRepository.trash({contentPath: relPath}, false);
                break;
            case INotifyWaitEvents.REMOVE:
                /*
                 * If a file was removed
                 * just call FsLoader onDeleted and then mark the document as deleted on db
                 */
                await this.onDeletedFile(absPath, async (absPath: string) => {
                    await this.wikiRepository.trash({contentPath: relPath}, false);
                });
                break;
            // case INotifyWaitEvents.MOVE_FROM:
            //     await this.onDeletedFile(absPath, async (absPath: string) => {
            //         await this.wikiRepository.trash({contentPath: relPath}, false);
            //     });
            //     break;
        }
        return;
    }

    async syncFilesToDb() {
        let globPath = this.absSyncBasePath + "/**/*";
        const files = glob.globSync(globPath, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .filter(p => !this.ignoreFileExtensionsRegExp.test(p))
            .flatMap(files => files);
        await Promise.all(files.map(filePath => {
            /*
                load doc from file
                save the doc to db (avoid signals)
                save again to file (update metadata)
             */
            // this.log.debug(`Sync file to db: ${filePath}`)
            return this.loadFile(filePath, async (absPath: string, doc: WikiDocument) => {
                doc = await this.wikiRepository.upsert(doc, false);
                const [mediaType, fsLoader] = await this._getMediaTypeAndFsLoader(absPath);
                await fsLoader.save(absPath, doc);
            });
        }));
    }

    async syncDbToFiles() {
        let docs = await this.wikiRepository.mongo.find({}, WikiDocument);
        await Promise.all(
            docs.map(
                async (doc) => {
                    let [relPath, absPath] = this._getRelAbsPaths(doc.contentPath);
                    // this.log.debug(`Sync db to file: ${absPath}`)
                    if (doc.deleted) {
                        // if document is flagged as deleted, just delete the related file
                        return await this.onDeletedFile(absPath);
                    } else {
                        // if document exists, save it to file, then update document itself if required (no content path)
                        // avoid to raise another db event to exit the loop
                        return await this.saveFile(absPath, doc, doc.contentPath ? undefined :
                            async (absPath: string, doc: WikiDocument) => {
                                doc.contentPath = relPath;
                                await this.wikiRepository.upsert(doc, false);
                            });
                    }
                })
        );
    }

}