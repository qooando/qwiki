import {BeanConstants} from "@qwiki/core/beans/BeanUtils";
import {ModuleScanner} from "@qwiki/core/scanners/ModuleScanner";
import {Bean} from "@qwiki/core/beans/Bean";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as yaml from "yaml";
import * as fs from "node:fs";
import * as uuid from "uuid";
import * as path from "node:path";

export class YamlConfigurationScanner extends ModuleScanner {
    static __bean__: __Bean__ = {}

    supportedExtensions = [
        ".config.json",
        ".config.yaml",
    ]

    async findBeansByPath(file: string): Promise<Bean[]> {
        // @ts-ignore
        let content: any = yaml.parse(fs.readFileSync(file, "utf-8"));
        let beanInfo = content[BeanConstants.BEAN_FIELD_NAME] ?? {};
        beanInfo.name = beanInfo.name ?? path.basename(file);
        beanInfo.path = file;
        class InlineClass {
            static __bean__: __Bean__ = beanInfo
            async postConstruct() {
                Object.assign(this, content);
                // FIXME make this configuration dynamic, if file changes, then change the config
            }
        }
        return [new Bean(InlineClass)]
    }

}
