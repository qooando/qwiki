import * as assert from "assert";
import {Strings} from "@qwiki/core/utils/Strings";
import {BeanConstants, BeanUtils} from "@qwiki/core/beans/BeanUtils";

export class AutowiredPlaceholder<T> {
    beanIdentifier: string;
    asList: boolean;
    mapKeyFun: (x: T) => string;
    optional: boolean;

    constructor(beanIdentifier: (new () => T) | string,
                optional: boolean = false,
                asList: boolean = false,
                mapKeyFun: ((x: T) => string) = undefined) {
        if (typeof beanIdentifier !== "string") {
            beanIdentifier = BeanUtils.getBeanIdentifierFromClass(beanIdentifier);
        }
        this.beanIdentifier = beanIdentifier;
        this.asList = asList;
        this.optional = optional;
        this.mapKeyFun = mapKeyFun;
    }

    async resolve(): Promise<any> {
        return await $qw.require(this.beanIdentifier, this.optional, this.asList, this.mapKeyFun);
    }
}

export function getAutowiredFields(obj: any) {
    return Object.entries(obj)
        .filter((x: [string, any]) => x[1] instanceof AutowiredPlaceholder)
        .map((x: [string, AutowiredPlaceholder<any>]) => x);
    // return Object.fromEntries(entries);
}

export function Autowire<T>(definition: (new () => T) | string): T;
export function Autowire<T>(definition: (new () => T)[] | string[]): T[];
export function Autowire<T>(definition: (new () => T) | (new () => T)[] | string | string[],
                            keyFun: (x: T) => string): Map<string, T>;
export function Autowire<T>(definition: (new () => T) | (new () => T)[] | string | string[],
                            keyFun: (x: T) => string,
                            optional: boolean): Map<string, T>;
export function Autowire<T>(definition: (new () => T) | (new () => T)[] | string | string[],
                            keyFun: (x: T) => string = undefined,
                            optional: boolean = false): T | T[] | Map<string, T> {
    assert(definition)
    assert(optional !== undefined)
    let asList = Array.isArray(definition) || !!keyFun;
    if (Array.isArray(definition)) {
        assert(definition.length == 1);
        definition = definition[0]
    }
    if (asList && keyFun) {
        return new AutowiredPlaceholder(definition, optional, false, keyFun) as unknown as Map<string, T>;
    }
    if (asList && !keyFun) {
        return new AutowiredPlaceholder(definition, optional, true) as unknown as T[];
    }
    return new AutowiredPlaceholder(definition, optional) as T;
}
