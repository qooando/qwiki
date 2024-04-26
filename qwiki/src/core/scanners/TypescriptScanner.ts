import {__Bean__} from "../beans/__Bean__";
import {BeanConstants} from "@qwiki/core/beans/BeanUtils";
import {ModuleScanner} from "@qwiki/core/beans/ModuleScanner";
import {Bean} from "@qwiki/core/beans/Bean";

export class TypescriptScanner extends ModuleScanner {
    static __bean__: __Bean__ = {
        dependsOn: []
    }

    supportedExtensions = [
        ".ts"
    ]

    // supportedMimeTypes: Array<string> = [
    //     "video/mp2t", // .ts
    // ]

    async findBeansByPath(path: string): Promise<Bean[]> {
        let content = await import(path);
        return Object.entries(content)
            .filter((e: [string, any]) => BeanConstants.BEAN_FIELD_NAME in e[1])
            .map((e: [string, any]) => {
                let b = new Bean(e[1]);
                b.path = path;
                return b;
            })
    }

}
