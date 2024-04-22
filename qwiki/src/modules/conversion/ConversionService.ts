import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Converter} from "@qwiki/modules/conversion/Converter";

export class ConversionService {
    static __bean__: __Bean__ = {}

    converters: Map<string, Converter> = Autowire([`class:Converter`], (x: Converter) => x.name(), true);

    convert<From, To>(source: From, toClazz: new () => To): To {
        let converterName = `${source.constructor.name}->${toClazz.name}`;
        if (!this.converters.has(converterName)) {
            throw new Error(`Converter not found: ${converterName}`);
        }
        let converter = this.converters.get(converterName);
        return converter.convert(source);
    }
}