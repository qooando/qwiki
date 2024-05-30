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
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import * as uuid from "uuid";
import {query} from "express";

export enum WikiDocumentRepositoryEvents {
    UPDATE = "update",
    TRASH = "trash",
    DELETE = "delete",
    ALL = "all"
}

export class WikiDocumentRepository extends Base {
    static __bean__: __Bean__ = {}

    /*
        mongo
        file system sync (separated, with event binding)
     */

    mongo = Autowire(MongoRepository);
    files = Autowire(FilesRepository);
    // documentsPath = Value("qwiki.applications.wiki.documentsPath", "./data");
    defaultProject = Value("qwiki.applications.wiki.defaultProject", "main");

    // FIXME monitor folder for changes and update mongo document accordingly
    // FIXME permits other save formats (e.g. any file format with a companion .json metadata file
    // e.g. logo.jpg logo.jpg.meta.json

    async postConstruct() {
        this.on(WikiDocumentRepositoryEvents.UPDATE, (doc: WikiDocument) => this.emit(WikiDocumentRepositoryEvents.ALL, WikiDocumentRepositoryEvents.UPDATE, doc));
        this.on(WikiDocumentRepositoryEvents.TRASH, (doc: WikiDocument) => this.emit(WikiDocumentRepositoryEvents.ALL, WikiDocumentRepositoryEvents.TRASH, doc));
        this.on(WikiDocumentRepositoryEvents.DELETE, (doc: WikiDocument) => this.emit(WikiDocumentRepositoryEvents.ALL, WikiDocumentRepositoryEvents.DELETE, doc));
    }

    async trash(query: WikiDocument | any, emitEvent: boolean = true) {
        if (query instanceof WikiDocument) {
            query = {"_id": query._id};
        }
        const update = {$set: {"deleted": true}};
        let doc = await this.mongo.upsert(query, update, WikiDocument, null, false);
        if (emitEvent) {
            this.emit(WikiDocumentRepositoryEvents.TRASH, doc);
        }
        return doc;
    }

    async delete(query: WikiDocument | any, emitEvent: boolean = true) {
        if (query instanceof WikiDocument) {
            query = {"_id": query._id};
        }
        let doc = await this.mongo.find(query, WikiDocument);
        await this.mongo.delete(query, WikiDocument);
        if (emitEvent) {
            this.emit(WikiDocumentRepositoryEvents.DELETE, doc);
        }
        return doc;
    }

    async upsert(doc: WikiDocument, emitEvent: boolean = true) {
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
        if (emitEvent) {
            this.emit(WikiDocumentRepositoryEvents.UPDATE, doc);
        }
        return doc;
    }

    findByContentPath(contentPath: string): Promise<WikiDocument> {
        throw new NotImplementedException();
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