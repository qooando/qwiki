import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as fs from "node:fs";
import {WikiMarkdownMetadata} from "../../models/WikiMarkdownMetadata";
import * as yaml from "yaml";
import * as path from "node:path";
import {WikiDocument} from "../models/WikiDocument";
import {MediaType} from "@qwiki/core/utils/MediaTypes";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {FilesRepository} from "../../../persistence-files/FilesRepository";

export class Markdown extends Base {
    static __bean__: __Bean__ = {}

    mediaTypes: string[] = [
        MediaType.TEXT_MARKDOWN
    ]
    splitMarkdown: RegExp = /^(?:---(?<metadata>.*?)---)?(?<content>.*)/s
    files: FilesRepository = Autowire(FilesRepository);

    async load(filePath: string): Promise<WikiDocument> {
        this.log.debug(`Read ${filePath}`);
        let match = this.splitMarkdown.exec(fs.readFileSync(filePath, "utf-8"))
        let metadata: WikiMarkdownMetadata = match.groups.metadata ? yaml.parse(match.groups.metadata) : {};
        let content = match.groups.content.trim();
        filePath = path.relative(this.files.basePath, filePath);
        let doc = new WikiDocument({
            _id: metadata.id,
            project: metadata.project,
            title: metadata.title,
            tags: metadata.tags,
            annotations: metadata.annotations,
            mediaType: MediaType.TEXT_MARKDOWN,
            contentPath: filePath,
            content: content
        });
        return doc;
    }

    async save(doc: WikiDocument) {
        let mdMetadata: WikiMarkdownMetadata = {
            id: doc._id,
            project: doc.project,
            title: doc.title,
            tags: doc.tags,
            annotations: doc.annotations
        };
        let mdContent = `---\n${yaml.stringify(mdMetadata)}---\n${doc.content}\n`;
        this.log.debug(`Save /${path.relative("/", doc.contentPath)}`)
        await this.files.save(doc.contentPath, mdContent);
    }
}