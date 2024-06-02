import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import * as fs from "node:fs";

export class FsLoader extends Base {
    declare mediaTypes: string[];
    declare fileExtensions: string[];
    declare ignoreFileExtensions: string[];

    async load(absPath: string): Promise<WikiDocument> {
        throw new NotImplementedException();
    }

    async save(absPath: string, doc: WikiDocument): Promise<WikiDocument> {
        throw new NotImplementedException();
    }

    async onMoved(fromAbsPath: string, toAbsPath: string): Promise<WikiDocument> {
        return await this.load(toAbsPath);
    }

    async onDeleted(absPath: string): Promise<void> {
        if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
        }
    }
}