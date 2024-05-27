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
import {Objects} from "@qwiki/core/utils/Objects";
import {FsSync} from "@qwiki/modules/wiki/persistence/fs/FsSync";
import {Value} from "@qwiki/core/beans/Value";
import {WikiDocumentRepository} from "@qwiki/modules/wiki/persistence/WikiDocumentRepository";

export class FsSyncMarkdown extends FsSync {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.applications.wiki.fsSync.markdown.enable", false)
    }

    mediaTypes: string[] = [
        MediaType.TEXT_MARKDOWN
    ]
    fileExtensions: string[] = [
        "md"
    ]
    syncSubPath = Value("qwiki.applications.wiki.fsSync.markdown.subPath", "");

    splitMarkdown: RegExp = /^(?:---(?<metadata>.*?)---)?(?<content>.*)/s

    async postConstruct() {
        await super.postConstruct();
    }

    async _loadUnsafe(absPath: string): Promise<WikiDocument> {
        let match = this.splitMarkdown.exec(fs.readFileSync(absPath, "utf-8"))
        let metadata: WikiMarkdownMetadata = (match.groups.metadata ? yaml.parse(match.groups.metadata) : {}) ?? {};
        let content = match.groups.content.trim();
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        let doc = new WikiDocument({
            _id: metadata.id,
            project: metadata.project,
            title: metadata.title,
            tags: metadata.tags,
            annotations: metadata.annotations,
            mediaType: MediaType.TEXT_MARKDOWN,
            contentPath: relPath,
            content: content
        });
        return doc;
    }

    async _saveUnsafe(absPath: string = undefined, doc: WikiDocument) {
        let mdMetadata: WikiMarkdownMetadata = {
            id: doc._id,
            project: doc.project,
            title: doc.title,
            tags: doc.tags,
            annotations: doc.annotations
        };
        let mdContent = `---\n${yaml.stringify(mdMetadata)}---\n${doc.content}\n`;
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        await this.filesRepository.save(relPath ?? doc.contentPath, mdContent);
    }
}