import * as assert from "node:assert";
import {__Bean__} from "@qwiki/core/beans/__Bean__";

export interface IConverter<From, To> {
    from: (new (...args: any[]) => From) | string
    to: (new (...args: any[]) => To) | string
    convert: (a: From) => To;
    name: () => string;
}

export abstract class Converter<From, To> implements IConverter<From, To> {
    abstract convert(a: From): To;

    name() {
        assert(this.from)
        assert(this.to)
        // @ts-ignore
        return `${this.from.name ?? this.from}->${this.to.name ?? this.to}`
    }

    // FIXME: https://typescript-rtti.org/ get from and to classes from generic parameters
    from: (new (...args: any[]) => From) | string
    to: (new (...args: any[]) => To) | string
}

export function converterFactory<From, To>(
    from: new (...args: any[]) => From,
    to: new (...args: any[]) => To,
    convert: (from: From) => To,
): new () => Converter<From, To> {
    let beanName = `${from.name}To${to.name}Converter`;

    class TemplateConverter extends Converter<From, To> {
        static __bean__: __Bean__ = {
            name: beanName
        }
        from = from;
        to = to;
        convert = convert;
    }

    return TemplateConverter;
}
