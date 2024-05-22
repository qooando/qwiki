import {ClassConstructor} from "@qwiki/core/utils/Types";

export class Objects {
    static getParentClasses(obj: any) {
        let parent = Object.getPrototypeOf(obj)
        if (!parent || !parent.name) {
            return []
        }
        let results = [parent]
        results.push(...Objects.getParentClasses(parent))
        return results;
    }

    static getValue(obj: any, valuePath: string) {
        let token = valuePath.split(".").reverse();
        let val = obj;
        while (token.length) {
            val = val[token.pop()];
        }
        return val;
    }

    static getValueOrDefault(obj: any, valuePath: string, valueDefault: any = undefined) {
        let token = valuePath.split(".").reverse();
        let val = obj;
        while (token.length) {
            let propName = token.pop();
            if (!val.hasOwnProperty(propName)) {
                return valueDefault;
            }
            val = val[propName];
        }
        if (!val) {
            return valueDefault;
        }
        return val;
    }

    static mapTo<T>(data: any = {}, klazz: ClassConstructor<T>) {
        let obj = Object.create(klazz.prototype);
        Object.assign(obj, data);
        return obj;
    }

}