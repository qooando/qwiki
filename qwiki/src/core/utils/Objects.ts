export class Objects {
    static getParentClasses(obj: any) {
        let parent = Object.getPrototypeOf(obj)
        if (!parent || !parent.name ) {
            return []
        }
        let results = [parent]
        results.push(...Objects.getParentClasses(parent))
        return results;
    }
}