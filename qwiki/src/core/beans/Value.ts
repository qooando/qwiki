import * as assert from "assert";
import {Strings} from "@qwiki/core/utils/Strings";
import {BeanConstants, BeanUtils} from "@qwiki/core/beans/BeanUtils";
import {Objects} from "@qwiki/core/utils/Objects";

export class ValuePlaceholder<T> {
    valuePath: string;
    optional: boolean;

    constructor(valuePath: string,
                optional: boolean = false) {
        this.valuePath = valuePath;
        this.optional = optional;
    }

    async resolve(): Promise<any> {
        return Objects.getValue($qw.config, this.valuePath);
    }
}

export function getValueFields(obj: any) {
    return Object.entries(obj)
        .filter((x: [string, any]) => x[1] instanceof ValuePlaceholder)
        .map((x: [string, ValuePlaceholder<any>]) => x);
}

export function Value<T>(valuePath: string,
                         optional: boolean = false): any | T | T[] | Map<string, T> {
    assert(valuePath)
    assert(optional !== undefined)
    return new ValuePlaceholder(valuePath, optional);
}
