import * as assert from "node:assert";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Converter} from "@qwiki/modules/conversion/Converter";
import {transform} from "node-json-transform";

export abstract class JsonTransformer extends Converter<any, any> {
    transformer: any;

    convert(a: any): any {
        return transform(a, this.transformer)
    }

    name(): string {
        assert(this.from)
        assert(this.to)
        return `${this.from}->${this.to}`
    }
}

export function transformerFactory(
    from: string,
    to: string,
    transformer: any
): new () => JsonTransformer {
    let beanName = `${from}To${to}Converter`;

    class TemplateTransformer extends JsonTransformer {
        static __bean__: __Bean__ = {
            name: beanName
        }
        from = from;
        to = to;
        transformer = transformer;
    }

    return TemplateTransformer;
}
