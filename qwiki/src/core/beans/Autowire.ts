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
    if (typeof definition === "string") {
        return new AutowiredField(definition, optional, false);
    } else if (Array.isArray(definition)) {
        definition = definition[0];
        if (typeof definition === "string") {
            return new AutowiredField<T>(definition, optional, true);
        } else {
            return new AutowiredField(`class:${definition.constructor.name}`, optional, true);
        }
    } else {
        return new AutowiredField(`class:${definition.constructor.name}`, optional, false);
    }
}