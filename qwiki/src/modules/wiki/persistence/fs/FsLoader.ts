import {Base} from "@qwiki/core/base/Base";
import {WikiDocument} from "@qwiki/modules/wiki/persistence/models/WikiDocument";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

export class FsLoader extends Base {
    declare mediaTypes: string[];
    declare fileExtensions: string[];

    async load(absPath: string): Promise<WikiDocument> {
        throw new NotImplementedException();
    }

    async save(absPath: string, doc: WikiDocument) {
        throw new NotImplementedException();
    }

}