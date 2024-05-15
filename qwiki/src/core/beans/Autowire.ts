import {Strings} from "@qwiki/core/utils/Strings";
import {BeanConstants, BeanUtils} from "@qwiki/core/beans/BeanUtils";
import {assert} from "@qwiki/core/utils/common";
import {BeanFactoryOptions} from "@qwiki/core/beans/ModuleManager";
import {ClassConstructor, FilterFunction, KeyFunction} from "@qwiki/core/utils/Types";
import {Bean} from "@qwiki/core/beans/Bean";

export enum AutowireResolveKind {
    AS_CLASS,
    AS_INSTANCE,
}

export interface AutowiredPlaceholderOptions extends BeanFactoryOptions {
    resolveAs?: AutowireResolveKind
}

export class AutowiredPlaceholder<T> {
    beanIdentifier: string;
    options: AutowiredPlaceholderOptions;

    constructor(beanIdentifier: (new () => T) | string,
                options: AutowiredPlaceholderOptions = undefined) {
        if (typeof beanIdentifier !== "string") {
            beanIdentifier = BeanUtils.getBeanIdentifierFromClass(beanIdentifier);
        }
        this.beanIdentifier = beanIdentifier;
        this.options = options;
    }

    async resolve(): Promise<any> {
        switch (this.options.resolveAs) {
            case AutowireResolveKind.AS_CLASS:
                return await $qw._moduleManager.getBeanClass(this.beanIdentifier, this.options);
            case AutowireResolveKind.AS_INSTANCE:
            default:
                return await $qw._moduleManager.getBeanInstance(this.beanIdentifier, this.options);
        }
    }
}

export function getAutowiredFields(obj: any) {
    return Object.entries(obj)
        .filter((x: [string, any]) => x[1] instanceof AutowiredPlaceholder)
        .map((x: [string, AutowiredPlaceholder<any>]) => x);
    // return Object.fromEntries(entries);
}

export function Autowire<T>(definition: ClassConstructor<T> | string): T;
export function Autowire<T>(definition: ClassConstructor<T> | string,
                            optional: boolean): T;
export function Autowire<T>(definition: ClassConstructor<T>[] | string[]): T[];
export function Autowire<T>(definition: ClassConstructor<T>[] | string[],
                            filterFn: FilterFunction<T>): T[];
export function Autowire<T>(definition: ClassConstructor<T>[] | string[],
                            filterFn: FilterFunction<T>,
                            keyFun: KeyFunction<T>): Map<string, T>;
export function Autowire<T>(definition: ClassConstructor<T> | ClassConstructor<T>[] | string | string[],
                            arg1: FilterFunction<T> | boolean = undefined,
                            arg2: KeyFunction<T> = undefined): T | T[] | Map<string, T> {
    assert(definition)

    let options: AutowiredPlaceholderOptions = {
        isOptional: false,
        asList: false,
        asMap: false,
        keyFun: undefined,
        filterFun: undefined,
        resolveAs: AutowireResolveKind.AS_INSTANCE
    }

    if (arg1) {
        if (typeof arg1 === "boolean") {
            options.isOptional = arg1;
        } else {
            options.isOptional = true;
            options.filterFun = arg1;
        }
    }

    if (arg2) {
        options.keyFun = arg2;
        options.asMap = true;
        options.isOptional = true;
    }

    if (Array.isArray(definition)) {
        assert(definition.length == 1);
        definition = definition[0]
        options.asList = !options.asMap;
        options.isOptional = true;
    }

    return new AutowiredPlaceholder(definition, options) as T | T[] | Map<string, T>;
}


export function AutowireFactory<T>(definition: ClassConstructor<T> | string): Bean;
export function AutowireFactory<T>(definition: ClassConstructor<T> | string,
                                   optional: boolean): Bean;
export function AutowireFactory<T>(definition: ClassConstructor<T>[] | string[]): Bean[];
export function AutowireFactory<T>(definition: ClassConstructor<T>[] | string[],
                                   filterFn: FilterFunction<Bean>): Bean[];
export function AutowireFactory<T>(definition: ClassConstructor<T>[] | string[],
                                   filterFn: FilterFunction<Bean>,
                                   keyFun: KeyFunction<Bean>): Map<string, Bean>;
export function AutowireFactory<T>(definition: ClassConstructor<T> | ClassConstructor<T>[] | string | string[],
                                   arg1: FilterFunction<Bean> | boolean = undefined,
                                   arg2: KeyFunction<Bean> = undefined): Bean | Bean[] | Map<string, Bean> {
    assert(definition)

    let options: AutowiredPlaceholderOptions = {
        isOptional: false,
        asList: false,
        asMap: false,
        keyFun: undefined,
        filterFun: undefined,
        resolveAs: AutowireResolveKind.AS_CLASS
    }

    if (arg1) {
        if (typeof arg1 === "boolean") {
            options.isOptional = arg1;
        } else {
            options.isOptional = true;
            options.filterFun = arg1;
        }
    }

    if (arg2) {
        options.keyFun = arg2;
        options.asMap = true;
        options.isOptional = true;
    }

    if (Array.isArray(definition)) {
        assert(definition.length == 1);
        definition = definition[0]
        options.asList = !options.asMap;
        options.isOptional = true;
    }

    return new AutowiredPlaceholder(definition, options) as unknown as Bean | Bean[] | Map<string, Bean>;
}
