import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {FsLoader} from "@qwiki/modules/wiki/persistence/fs/FsLoader";
import {detectFile, MediaType} from "@qwiki/core/utils/MediaTypes";
import {WikiDocumentMetadata} from "@qwiki/modules/wiki/models/WikiDocumentMetadata";
import * as fs from "node:fs";
import * as yaml from "yaml";
import * as path from "node:path";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {FilesRepository} from "@qwiki/modules/persistence-files/FilesRepository";
import * as mmm from "mmmagic";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {load} from "js-yaml";

export class FsLoaderAny extends FsLoader {
    static __bean__: __Bean__ = {}

    mediaTypes: string[] = [
        MediaType.ANY
    ]
    fileExtensions: string[] = [
        "*"
    ]
    splitCss: RegExp = /^(?:\/\*(?<metadata>.*?)\*\/)?(?<content>.*)/s
    filesRepository = Autowire(FilesRepository);
    metaExt = ".meta"
    ignoreFileExtensions: string[] = [
        ".meta"
    ]

    async load(absPath: string): Promise<WikiDocument> {
        let metaAbsPath = `${absPath}${this.metaExt}`
        let metadata: WikiDocumentMetadata = {}
        if (fs.existsSync(metaAbsPath)) {
            metadata = JSON.parse(fs.readFileSync(metaAbsPath, "utf-8"));
        }
        let content = fs.readFileSync(absPath, "utf-8");
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        let mediaType: string = await detectFile(absPath);
        let doc = new WikiDocument({
            _id: metadata.id,
            project: metadata.project,
            title: metadata.title,
            tags: metadata.tags,
            annotations: metadata.annotations,
            mediaType: mediaType,
            contentPath: relPath,
            content: content
        });
        return doc;
    }

    async save(absPath: string, doc: WikiDocument) {
        let metaAbsPath = `${absPath}${this.metaExt}`
        let meta: WikiDocumentMetadata = {
            id: doc._id,
            project: doc.project,
            title: doc.title,
            tags: doc.tags,
            annotations: doc.annotations
        };
        let content = doc.content;
        let relPath = path.relative(this.filesRepository.basePath, absPath);
        await this.filesRepository.save(relPath ?? doc.contentPath, content);
        let metaRelPath = path.relative(this.filesRepository.basePath, metaAbsPath);
        await this.filesRepository.save(metaRelPath ?? `${doc.contentPath}${this.metaExt}`, JSON.stringify(meta));
        return doc;
    }

    async onDeleted(absPath: string): Promise<void> {
        if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
        }
        let metaAbsPath = `${absPath}${this.metaExt}`
        if (fs.existsSync(metaAbsPath)) {
            fs.unlinkSync(metaAbsPath);
        }
    }

    async onMoved(fromAbsPath: string, toAbsPath: string): Promise<WikiDocument> {
        let metaFromAbsPath = `${toAbsPath}${this.metaExt}`;
        let metaToAbsPath = `${toAbsPath}${this.metaExt}`;
        if (fs.existsSync(metaFromAbsPath)) {
            fs.renameSync(metaFromAbsPath, toAbsPath);
        }
        return await this.load(toAbsPath);
    }
}