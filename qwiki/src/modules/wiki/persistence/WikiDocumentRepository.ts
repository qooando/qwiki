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

export class WikiDocumentRepository extends Base {
    static __bean__: __Bean__ = {}

    mongo = Autowire(MongoRepository);
    documentsPath = Value("qwiki.applications.wiki.documentsPath", "./data");
    defaultProject = Value("qwiki.applications.wiki.defaultProject", "main");

    markdown = Autowire(Markdown)
    supportedExtensions = [
        ".md"
    ]

    async postConstruct() {
        /*
         reindex files at startup
         */
        await this.rebuildIndex();
    }

    async rebuildIndex(searchPath: string = undefined) {
        searchPath ??= this.documentsPath;
        searchPath = fs.realpathSync(searchPath);
        // const re = new RegExp(this.supportedExtensions.map(x => `${x}$`).join("|"))
        const files = glob.globSync(`${searchPath}/**/*.md`, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .flatMap(files => files);

        Promise.all(files.map(filePath => {
            return this.markdown.load(filePath)
                .then(doc => this.save(doc));
        }));
    }

    // FIXME monitor folder for changes and update mongo document accordingly
    // FIXME permits other save formats (e.g. any file format with a companion .json metadata file
    // e.g. logo.jpg logo.jpg.meta.json

    async save(doc: WikiDocument, mirrorToFile: boolean = true) {
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
            "_id": doc._id
        }
        let update = {
            $setOnInsert: {
                "_id": doc._id
            },
            $set: {
                "project": doc.project,
                "tags": doc.tags,
                "annotations": doc.annotations,
                "contentPath": doc.contentPath,
                "content": doc.content,
                "mediaType": doc.mediaType
            }
        };
        doc = await this.mongo.upsert(
            query,
            update,
            WikiDocument);

        // save file
        this.markdown.save(doc);
        return doc;
    }

    async findByTitle(title: string) {
        throw new NotImplementedException();
    }

    async findByTag(tag: string) {
        throw new NotImplementedException();
    }

    async findByAnnotation(annotation: string) {
        throw new NotImplementedException();
    }

}