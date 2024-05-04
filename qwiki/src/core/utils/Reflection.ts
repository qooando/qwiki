export namespace Reflection {

    export function getPrototypeOf(obj: any) {
        return Reflect.getPrototypeOf(obj);
    }

    export function getAllElementNames(obj: any) {
        let result = [];
        let curr = obj;
        while (curr.constructor.name !== "Object") {
            result.push(...Object.getOwnPropertyNames(curr));
            curr = getPrototypeOf(curr);
        }
        return result;
    }

    export function getMethods(obj: any): Map<string, any> {
        let result: any = new Map<string, any>();
        for (let name of getAllElementNames(obj)) {
            if (typeof obj[name] === "function") {
                result.set(name, obj[name].bind(obj));
            }
        }
        return result;
    }

    export function getFields(obj: any): Map<string, any> {
        let result: any = new Map<string, any>();
        for (let name of getAllElementNames(obj)) {
            if (typeof obj[name] !== "function") {
                result.set(name, obj[name]);
            }
        }
        return result;
    }

}