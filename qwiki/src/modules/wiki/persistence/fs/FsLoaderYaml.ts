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

export class FsLoaderYaml extends FsLoader {
    static __bean__: __Bean__ = {}

    mediaTypes: string[] = [
        MediaType.APPLICATION_JSON,
        MediaType.APPLICATION_YAML,
        MediaType.TEXT_YAML
    ]
    fileExtensions: string[] = [
        "yaml",
        "json"
    ]
    metadataFieldName = "__metadata__"
    filesRepository = Autowire(FilesRepository);

    async load(absPath: string): Promise<WikiDocument> {
        let content = yaml.parse(fs.readFileSync(absPath, "utf-8")) ?? {};
        let metadata: WikiDocumentMetadata = content[this.metadataFieldName] ?? {};
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        delete content[this.metadataFieldName];
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

    async save(absPath: string, doc: WikiDocument) {
        let metadata: WikiDocumentMetadata = {
            id: doc._id,
            project: doc.project,
            title: doc.title,
            tags: doc.tags,
            annotations: doc.annotations
        };
        let content = doc.content;
        content[this.metadataFieldName] = metadata;
        let rawContent = absPath.endsWith(".yaml") ?
            yaml.stringify(content) :
            JSON.stringify(content)
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        await this.filesRepository.save(relPath ?? doc.contentPath, rawContent);
        return doc;
    }


}