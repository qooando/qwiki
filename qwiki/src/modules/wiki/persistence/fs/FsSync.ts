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

export class FsSync extends Base {
    declare mediaTypes: string[];
    declare fileExtensions: string[];
    declare syncSubPath: string;
    absSyncBasePath: string;

    filesRepository = Autowire(FilesRepository);
    fileExtensionsRegexp: RegExp;
    fileLastAccess: Map<String, number> = new Map();

    wikiRepository = Autowire(WikiDocumentRepository);

    async postConstruct() {
        const self = this;
        this.absSyncBasePath = path.join(process.cwd(), this.filesRepository.basePath, this.syncSubPath)
        this.fileExtensionsRegexp = new RegExp(`\.(${this.fileExtensions.join("|")})$`);
        this.log.debug(`Sync database → filesystem`)
        await this.syncDbToFiles();
        this.log.debug(`Sync filesystem → database`)
        await this.syncFilesToDb();
        this.log.debug(`Sync on database events → filesystem`)
        this.wikiRepository.on(WikiDocumentRepositoryEvents.ALL, this.onDbEvent.bind(this));
        this.log.debug(`Sync on filesystem events → database`)
        this.filesRepository.watcher.on(INotifyWaitEvents.ALL, this.onFileEvent.bind(this));
    }

    async load(absPath: string, then: (absPath: string, doc: WikiDocument) => Promise<void> = undefined): Promise<WikiDocument> {
        if (await this.filesRepository.lockFile(absPath)) {
            let doc = await this._loadUnsafe(absPath)
            if (then) {
                await then(absPath, doc);
            }
            await this.filesRepository.unlockFile(absPath);
            return doc;
        }
    }

    async save(absPath: string, doc: WikiDocument, then: (absPath: string, doc: WikiDocument) => Promise<void> = undefined) {
        if (await this.filesRepository.lockFile(absPath)) {
            await this._saveUnsafe(absPath, doc)
            if (then) {
                await then(absPath, doc);
            }
            await this.filesRepository.unlockFile(absPath);
        }
    }

    async delete(absPath: string, then: (absPath: string) => Promise<void> = undefined): Promise<void> {
        if (await this.filesRepository.lockFile(absPath)) {
            await this._deleteUnsafe(absPath)
            if (then) {
                await then(absPath);
            }
            await this.filesRepository.unlockFile(absPath);
        }
    }

    async _loadUnsafe(absPath: string): Promise<WikiDocument> {
        throw new NotImplementedException();
    }

    async _saveUnsafe(absPath: string, doc: WikiDocument) {
        throw new NotImplementedException();
    }

    async _deleteUnsafe(absPath: string): Promise<void> {
        if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
        }
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
        if (!this.mediaTypes.includes(doc.mediaType)) return;
        // FIXME transform title to a better filename
        let [relPath, absPath] = this._getRelAbsPaths(doc.contentPath ?? `${doc.title ?? doc._id}.${this.fileExtensions[0]}`);
        switch (event) {
            case WikiDocumentRepositoryEvents.UPDATE:
                await this.save(absPath, doc, doc.contentPath ? undefined :
                    async (absPath: string, doc: WikiDocument) => {
                        doc.contentPath = relPath;
                        await this.wikiRepository.upsert(doc, false);
                    });
                break;
            case WikiDocumentRepositoryEvents.DELETE:
            case WikiDocumentRepositoryEvents.TRASH:
                await this.delete(absPath);
                break;
        }

        return;
    }

    async onFileEvent(event: INotifyWaitEvents, filePath: string) {
        // avoid to manage unwanted files
        if (!this.fileExtensionsRegexp.test(filePath)) return;
        if (event === INotifyWaitEvents.UNKNOWN) return;
        // filepath is relative to process.cwd()
        filePath = path.join(process.cwd(), filePath);
        let [relPath, absPath] = this._getRelAbsPaths(filePath);
        if (fs.existsSync(absPath)) {
            let mtime = fs.statSync(absPath).mtimeMs;
            if (this.fileLastAccess.has(absPath) &&
                this.fileLastAccess.get(absPath) >= mtime) {
                return;
            }
        }
        switch (event) {
            case INotifyWaitEvents.CREATE:
            case INotifyWaitEvents.MOVE_IN:
            case INotifyWaitEvents.CHANGE:
                // load the document and upsert
                // FIXME c'è un salvataggio di troppo sul move_in ?
                await this.load(absPath, async (absPath: string, doc: WikiDocument) => {
                    doc = await this.wikiRepository.upsert(doc, false);
                    await this._saveUnsafe(absPath, doc);
                    // blacklisting by timestamp
                    let mtime = fs.statSync(absPath).mtimeMs;
                    if (!this.fileLastAccess.has(absPath) ||
                        this.fileLastAccess.get(absPath) < mtime) {
                        this.fileLastAccess.set(absPath, mtime);
                    }
                });
                break;
            case INotifyWaitEvents.REMOVE:
            case INotifyWaitEvents.MOVE_OUT:
                // trash a document in the db
                await this.wikiRepository.trash({contentPath: relPath}, false);
                break;
        }
        return;
    }

    async syncFilesToDb() {
        let globPath = this.absSyncBasePath + "/**/*.md";
        const files = glob.globSync(globPath, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .flatMap(files => files);
        await Promise.all(files.map(filePath => {
            /*
                load doc from file
                save the doc to db (avoid signals)
                save again to file (update metadata)
             */
            this.log.debug(`Sync file to db: ${filePath}`)
            return this.load(filePath, async (absPath: string, doc: WikiDocument) => {
                doc = await this.wikiRepository.upsert(doc, false);
                await this._saveUnsafe(absPath, doc);
            });
        }));
    }

    async syncDbToFiles() {
        let docs = await this.wikiRepository.mongo.find({mediaType: {$in: this.mediaTypes}}, WikiDocument);
        await Promise.all(
            docs.map(
                async (doc) => {
                    let [relPath, absPath] = this._getRelAbsPaths(doc.contentPath ?? `${doc.title ?? doc._id}.${this.fileExtensions[0]}`);
                    this.log.debug(`Sync db to file: ${absPath}`)
                    if (doc.deleted) {
                        // if document is flagged as deleted, just delete the related file
                        return await this.delete(absPath);
                    } else {
                        // if document exists, save it to file, then update document itself if required (no content path)
                        // avoid to raise another db event to exit the loop
                        return await this.save(absPath, doc, doc.contentPath ? undefined :
                            async (absPath: string, doc: WikiDocument) => {
                                doc.contentPath = relPath;
                                await this.wikiRepository.upsert(doc, false);
                            });
                    }
                })
        );
    }

}