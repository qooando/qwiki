import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {FsLoader} from "@qwiki/modules/wiki/persistence/fs/FsLoader";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import {WikiDocumentMetadata} from "@qwiki/modules/wiki/models/WikiDocumentMetadata";
import * as fs from "node:fs";
import * as yaml from "yaml";
import * as path from "node:path";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {FilesRepository} from "@qwiki/modules/persistence-files/FilesRepository";
import {__Bean__} from "@qwiki/core/beans/__Bean__";

export class FsLoaderHtml extends FsLoader {
    static __bean__: __Bean__ = {}

    mediaTypes: string[] = [
        MediaType.TEXT_HTML
    ]
    fileExtensions: string[] = [
        "html"
    ]
    splitHtml: RegExp = /^(?:<!--metadata\n(?<metadata>.*?)\n-->)?(?<content>.*)/s
    filesRepository = Autowire(FilesRepository);

    async load(absPath: string): Promise<WikiDocument> {
        let match = this.splitHtml.exec(fs.readFileSync(absPath, "utf-8"))
        let metadata: WikiDocumentMetadata = (match.groups.metadata ? yaml.parse(match.groups.metadata) : {}) ?? {};
        let content = match.groups.content.trim();
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        let doc = new WikiDocument({
            _id: metadata.id,
            project: metadata.project,
            title: metadata.title,
            tags: metadata.tags,
            annotations: metadata.annotations,
            mediaType: MediaType.TEXT_HTML,
            contentPath: relPath,
            content: content
        });
        return doc;
    }

    async save(absPath: string, doc: WikiDocument) {
        let metadata: WikiDocumentMetadata = {
            id: doc._id,
            project: doc.project,
            title: doc.title,
            tags: doc.tags,
            annotations: doc.annotations
        };
        let content = `<!--metadata\n${yaml.stringify(metadata)}\n-->\n${doc.content}\n`;
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        await this.filesRepository.save(relPath ?? doc.contentPath, content);
        return doc;
    }


}