import {BeanConstants} from "@qwiki/core/beans/BeanUtils";
import {ModuleScanner} from "@qwiki/core/scanners/ModuleScanner";
import {Bean} from "@qwiki/core/beans/Bean";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as yaml from "yaml";
import * as fs from "node:fs";
import * as uuid from "uuid";
import * as path from "node:path";
import {converterFactory} from "@qwiki/modules/conversion/Converter";
import {transformerFactory} from "@qwiki/modules/conversion/JsonTransformer";
import * as assert from "node:assert";

export class JsonTransformerScanner extends ModuleScanner {
    static __bean__: __Bean__ = {}

    supportedExtensions = [
        ".transform.json",
        ".transform.yaml",
        ".transformer.json",
        ".transformer.yaml",
    ]

    async findBeansByPath(file: string): Promise<Bean[]> {
        // @ts-ignore
        let content: any = yaml.parse(fs.readFileSync(file, "utf-8"));
        let beanInfo = content[BeanConstants.BEAN_FIELD_NAME] ?? {};
        beanInfo.name = beanInfo.name ?? path.basename(file);
        beanInfo.path = file;
        let transformer = content.transformer ?? content.transform ?? content.converter ?? {};
        let from = content.from;
        let to = content.to;
        assert(transformer, `${file} MUST define a transformer (json trasformer) field`)
        assert(from, `${file} MUST define a from (class name) field`)
        assert(to, `${file} MUST define a to (class name) field`)
        let bean = new Bean(transformerFactory(from, to, transformer))
        bean.path = file;
        return [bean];
    }

}
