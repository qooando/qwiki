import {__Bean__} from "../beans/__Bean__";
import {Loader} from "./Loader";
import {BeanConstants} from "@qwiki/core/beans/BeanUtils";

export class TypescriptLoader extends Loader {
    static __bean__: __Bean__ = {
        dependsOn: []
    }

    supportedMimeTypes: Array<string> = [
        "video/mp2t", // .ts
    ]

    async loadCandidateBeans(path: string): Promise<[string, any][]> {
        return await import(path).then(content => {
            return Object.entries(content)
                .filter((e: [string, any]) => BeanConstants.BEAN_FIELD_NAME in e[1])
        });
    }

}
