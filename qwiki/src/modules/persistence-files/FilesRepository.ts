import {Objects} from "@qwiki/core/utils/Objects";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";
import {Base} from "@qwiki/core/base/Base";
import * as fs from "node:fs";
import * as path from "node:path";


export class FilesRepository extends Base {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.files", false)
    }

    basePath: string = Value("qwiki.persistence.files.basePath", "./data")

    async save(filePath: string, content: string) {
        return fs.writeFileSync(path.join(this.basePath, filePath), content, {encoding: "utf-8"});
    }

    async load(filePath: string) {
        return fs.readFileSync(path.join(this.basePath, filePath), {encoding: "utf-8"});
    }
}