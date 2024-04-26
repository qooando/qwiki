export class Arrays {

    static distincts<T>(items: T[], compareFn: (a: T, b: T) => number): T[] {
        // @ts-ignore
        if (items.length === 0) {
            return []
        }
        let arr = new Array(...items)
            .sort(compareFn);
        let result = [arr[0]];
        for (let i = 1; i < arr.length; i++) {
            if (compareFn(arr[i - 1], arr[i]) != 0) {
                result.push(arr[i]);
            }
        }
        return result;
    }
}