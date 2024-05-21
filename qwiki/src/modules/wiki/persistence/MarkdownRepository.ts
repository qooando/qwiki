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

export class MarkdownRepository extends Base {
    static __bean__: __Bean__ = {}

    mongo = Autowire(MongoRepository);
    files = Autowire(FilesRepository);
    documentsPath = Value("qwiki.applications.wiki.documentsPath", "./data");

    // splitMarkdown = /^(?:---(.*?)---)?(.*)/s
    splitMarkdown = /^(?:---(?<metadata>.*?)---)?(?<content>.*)/s
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
            .flatMap(files => files)
            .map(file => {
                let match = this.splitMarkdown.exec(fs.readFileSync(file, "utf-8"))
                // let metadata = result[1];
                // let metadata = result.groups.metadata;
                // let content = result.groups.content;
                let metadata = match.groups.metadata ? yaml.parse(match.groups.metadata) : {};
                let content = match.groups.content.trim();
                this.save(file, metadata, content);
            })
    }

    async save(path: string, metadata: any, content: string) {
        throw new NotImplementedException();
    }

    async load(path: string) {
        throw new NotImplementedException();
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