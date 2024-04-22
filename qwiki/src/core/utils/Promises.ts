export class Promises {

    static async sequentialMap<T, R>(arg: Promise<T[]>, fun: (t: T) => R): Promise<R[]> {
        return arg.then(items => {
            return items.map(item => fun.apply(item));
        })
    }

    // static async parallelMap<T, R>(arg: Promise<T[]>, fun: (t: T) => R): Promise<R[]> {
    //     arg.then(async items => {
    //
    //     })
    // }

    // static async sequential<T, R>(arg: Promise<T>[], fun: ((t: T) => R)): Promise<R>[] {
    //     for (let a of arg) {
    //         await
    //     }
    // }
    //
    // static async parallel<T, R>(arg: Promise<T>[], fun: ((t: T) => R)): Promise<R[]> {
    //     await Promise.all(arg.map(t => t.then(x => fun.apply(x)));
    // }
}