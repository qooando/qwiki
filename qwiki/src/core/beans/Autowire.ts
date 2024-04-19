import * as assert from "assert";

export class AutowiredField<T> {
    beanName: string;
    asList: boolean;
    optional: boolean

    constructor(beanName: string, optional: boolean = false, asList: boolean = false) {
        this.beanName = beanName;
        this.asList = asList;
    }

    resolve(): T | T[] {
        return $qw.require(this.beanName, this.optional, this.asList);
    }
}

export function Autowire<T>(definition: (new () => T) | (new () => T)[] | string | string[],
                            optional: boolean = false): AutowiredField<T> {
    assert(definition)
    assert(optional !== undefined)
    let placeholder: AutowiredField<T> = null;
    if (typeof definition === "string") {
        placeholder = new AutowiredField(definition, optional, false);
    } else if (Array.isArray(definition)) {
        assert(definition.length == 1);
        definition = definition[0];
        if (typeof definition === "string") {
            placeholder = new AutowiredField<T>(definition, optional, true);
        } else {
            placeholder = new AutowiredField(`class:${definition.name}`, optional, true);
        }
    } else {
        placeholder = new AutowiredField(`class:${definition.name}`, optional, false);
    }
    return placeholder;
}

export function getAutowiredFields(obj: any) {
    var entries = Object.entries(obj)
        .filter((x: [string, any]) => x[1] instanceof AutowiredField)
        .map((x: [string, AutowiredField<any>]) => x)
    return entries;
    // return Object.fromEntries(entries);
}