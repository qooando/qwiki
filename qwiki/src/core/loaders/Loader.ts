import {ILoader} from "./ILoader";
import {__Bean__} from "../beans/__Bean__";
import {BeanScope} from "../beans/BeanUtils";

export class Loader implements ILoader {

    supportedMimeTypes: Array<string> = []

    async loadCandidateBeans(path: string): Promise<[string, any][]> {
        throw new Error(`Not implemented`)
    }

}
