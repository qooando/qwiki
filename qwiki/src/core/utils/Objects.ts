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
        while(token.length) {
            val = val[token.pop()];
        }
        return val;
    }
}