import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {glob} from "glob";
import * as path from "node:path";
import * as fs from "node:fs";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {MongoRepository} from "@qwiki/modules/persistence-mongodb/MongoRepository";
import {FilesRepository} from "@qwiki/modules/persistence-files/FilesRepository";
import {Value} from "@qwiki/core/beans/Value";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import * as yaml from "yaml";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import {WikiMarkdownMetadata} from "@qwiki/modules/wiki/models/WikiMarkdownMetadata";
import {assert} from "@qwiki/core/utils/common";
import * as uuid from "uuid";
import {Markdown} from "@qwiki/modules/wiki/persistence/loaders/Markdown";
import {Semaphore} from "@qwiki/core/utils/Synchronize";
import {INotifyWaitEvents} from "@qwiki/modules/inotifywait/INotifyWait";

export class WikiDocumentRepository extends Base {
    static __bean__: __Bean__ = {}

    mongo = Autowire(MongoRepository);
    files = Autowire(FilesRepository);
    // documentsPath = Value("qwiki.applications.wiki.documentsPath", "./data");
    defaultProject = Value("qwiki.applications.wiki.defaultProject", "main");
    monitorFiles = Value("qwiki.applications.wiki.monitorFiles", true);
    monitorSemaphore = new Semaphore();
    monitorBlacklist: Map<String, number> = new Map();
    searchPath: string;

    markdown = Autowire(Markdown)
    supportedExtensions = [".md"]

    // FIXME monitor folder for changes and update mongo document accordingly
    // FIXME permits other save formats (e.g. any file format with a companion .json metadata file
    // e.g. logo.jpg logo.jpg.meta.json

    async postConstruct() {
        this.searchPath = fs.realpathSync(path.join(process.cwd(), this.files.basePath)) + "/**/*.md";
        /*
         reload all files
         */
        // if (!this.files.monitoringEnabled) {
        await this.syncFromPath(this.searchPath);
        // }

        const self = this;
        /*
         * to avoid conflicts, lock a file if you are working on it
         */
        // https://github.com/Inist-CNRS/node-inotifywait
        let watcher = this.files.watcher;
        watcher.on(INotifyWaitEvents.ALL, this.syncFromPathEvent.bind(this))

        // FIXME recreate files from mongo
    }

    async syncFromPathEvent(event: INotifyWaitEvents, filePath: string) {
        // avoid to manage unwanted files
        if (!filePath.endsWith(".md")) return;
        if (event === INotifyWaitEvents.UNKNOWN) return;
        // absolute path
        filePath = path.join(process.cwd(), this.files.basePath, filePath);
        // anti-cyclical test, avoid to manage blacklisted files (e.g. files edited by qwiki itself
        if (this.monitorBlacklist.has(filePath) &&
            fs.statSync(filePath).mtimeMs <= this.monitorBlacklist.get(filePath)) {
            this.monitorBlacklist.delete(filePath)
            return;
        }
        switch (event) {
            case INotifyWaitEvents.CREATE:
            case INotifyWaitEvents.MOVE_IN:
                if (await this.files.tryLockFile(filePath)) {
                    this.log.debug(`File created: ${filePath}`)
                    await this.syncFromPath(filePath)
                    await this.files.unlockFile(filePath);
                }
                break;
            case INotifyWaitEvents.REMOVE:
            case INotifyWaitEvents.MOVE_OUT:
                if (await this.files.lockFile(filePath)) {
                    this.log.debug(`File deleted: ${filePath}`)
                    await this.trash(filePath);
                    await this.files.unlockFile(filePath);
                }
                break;
            case INotifyWaitEvents.CHANGE:
                if (await this.files.tryLockFile(filePath)) {
                    this.log.debug(`File updated: ${filePath}`)
                    await this.syncFromPath(filePath);
                    await this.files.unlockFile(filePath);
                }
                break;
            // default:
            //     this.log.debug(`Not implemented file event: ${event} ${filePath}`);
        }
        return;
    }

    async syncFromPath(searchPath: string = undefined) {
        searchPath ??= this.searchPath;
        // const re = new RegExp(this.supportedExtensions.map(x => `${x}$`).join("|"))
        const files = glob.globSync(searchPath, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .flatMap(files => files);
        await Promise.all(files.map(filePath => {
            return this.markdown.load(filePath)
                .then(doc => this.save(doc));
        }));
    }

    async trash(contentPath: string) {
        if (path.isAbsolute(contentPath)) {
            contentPath = path.relative(this.files.basePath, contentPath);
        }
        let query = {contentPath: contentPath};
        let update = {$set: {"deleted": true}};
        let doc = await this.mongo.upsert(query, update, WikiDocument);
        if (fs.existsSync(contentPath)) {
            fs.unlinkSync(contentPath);
        }
        return doc;
    }

    async delete(contentPath: string) {
        if (path.isAbsolute(contentPath)) {
            contentPath = path.relative(this.files.basePath, contentPath);
        }
        await this.mongo.delete({contentPath: contentPath}, WikiDocument);
        if (fs.existsSync(contentPath)) {
            fs.unlinkSync(contentPath);
        }
    }

    async save(doc: WikiDocument) {
        /*
         * fill default fields
         * upsert on mongo
         * write all to file
         */
        doc._id ??= uuid.v4();
        doc.project ??= this.defaultProject;
        doc.contentPath ??= `${doc.project}/${doc.title}.md`;
        doc.tags ??= [];
        doc.annotations ??= new Map();
        doc.mediaType ??= MediaType.TEXT_MARKDOWN;

        let query = {
            $or: [
                {_id: doc._id},
                {contentPath: doc.contentPath}
            ]
        }
        let update = {
            $setOnInsert: {
                _id: doc._id
            }, $set: {
                project: doc.project,
                tags: doc.tags,
                annotations: doc.annotations,
                contentPath: doc.contentPath,
                content: doc.content,
                mediaType: doc.mediaType,
                deleted: false
            }
        };
        doc = await this.mongo.upsert(query, update, WikiDocument);

        // save file
        await this.markdown.save(doc);
        let filePath = path.join(process.cwd(), this.files.basePath, doc.contentPath);
        this.monitorBlacklist.set(filePath, fs.statSync(filePath).mtimeMs);
        return doc;
    }

    findByTitle(title: string) {
        throw new NotImplementedException();
    }

    findByTag(tag: string) {
        throw new NotImplementedException();
    }

    findByAnnotation(annotation: string) {
        throw new NotImplementedException();
    }

}