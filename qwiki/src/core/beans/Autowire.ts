import * as assert from "assert";
import {Strings} from "@qwiki/core/utils/Strings";
import {BeanConstants, BeanUtils} from "@qwiki/core/beans/BeanUtils";

export class AutowiredField<T> {
    beanIdentifier: string;
    asList: boolean;
    mapKeyFun: (x: T) => string;
    optional: boolean;

    constructor(beanIdentifier: (new () => T) | string, optional: boolean = false,
                asList: boolean = false,
                mapKeyFun: ((x: T) => string) = undefined) {
        if (typeof beanIdentifier !== "string") {
            beanIdentifier = BeanUtils.getBeanIdentifierFromClass(beanIdentifier);
        }
        this.beanIdentifier = beanIdentifier;
        this.asList = asList;
        this.mapKeyFun = mapKeyFun;
    }

    resolve(): any {
        return $qw.require(this.beanIdentifier, this.optional, this.asList, this.mapKeyFun);
    }
}

export function AutowireList<T>(definition: (new () => T) | string,
                                optional: boolean = false): T[] {
    assert(definition)
    assert(typeof optional === "boolean")
    return new AutowiredField(definition, optional, true) as unknown as T[];
}

export function AutowireMap<T>(definition: (new () => T) | string,
                               keyFun: (x: T) => string,
                               optional: boolean = false): Map<string, T> {
    assert(definition)
    assert(typeof optional === "boolean")
    return new AutowiredField(definition, optional, false, keyFun) as unknown as Map<string, T>;
}

export function AutowireValue<T>(definition: (new () => T) | string,
                                 optional: boolean = false): T {
    assert(definition)
    assert(optional !== undefined)
    return new AutowiredField(definition, optional) as T;
}

export function Autowire<R, T>(definition: (new () => T) | (new () => T)[] | string | string[],
                            keyFun: (x: T) => string = undefined,
                            optional: boolean = false): R {
    assert(definition)
    assert(optional !== undefined)
    let asList = Array.isArray(definition) || !!keyFun;
    if (Array.isArray(definition)) {
        assert(definition.length == 1);
        definition = definition[0]
    }
    if (asList && keyFun) {
        return AutowireMap<T>(definition, keyFun, optional) as unknown as R;
    }
    if (asList && !keyFun) {
        return AutowireList<T>(definition, optional) as unknown as R;
    }
    return AutowireValue<T>(definition, optional) as unknown as R;
}

export function getAutowiredFields(obj: any) {
    return Object.entries(obj)
        .filter((x: [string, any]) => x[1] instanceof AutowiredField)
        .map((x: [string, AutowiredField<any>]) => x);
    // return Object.fromEntries(entries);
}