export interface Prioritized {
    priority: number
}

export class Heap<T> {

    _comparator: Function;
    _items: Array<T>;

    static Comparators = {
        min: (a: any, b: any) => a - b,
        max: (a: any, b: any) => b - a,
        priority: (a: Prioritized, b: Prioritized) => (a.priority ?? 0) - (b.priority ?? 0)
    }

    constructor(comparator: Function | Heap<T> = undefined) {
        if (comparator instanceof Heap) {
            this._items = [...comparator._items]
            this._comparator = comparator._comparator
        } else {
            this._comparator = comparator ?? Heap.Comparators.min
            this._items = []
        }
    }

    size() {
        return this._items.length;
    }

    isEmpty() {
        return this._items.length === 0;
    }

    push(...items: T[]) {
        items.forEach(item => {
            this._items.push(item)
            this._siftUp()
        });
    }

    pop() {
        let items = this._items;
        let max = items.length - 1;
        [items[0], items[max]] = [items[max], items[0]];
        let top = this._items.pop()
        this._siftDown();
        return top;
    }

    _siftUp(i: number = undefined) {
        let items = this._items;
        i ??= items.length - 1;
        if (i === 0) {
            return;
        }
        let p = Math.floor((i - 1) / 2)
        if (this._comparator(items[i], items[p]) < 0) {
            // if item[i] < item[p] , item[i] must be on top
            [items[i], items[p]] = [items[p], items[i]];
        }
        if (p > 0) {
            this._siftUp(p);
        }
    }

    _siftDown(i: number = undefined) {
        let items = this._items,
            max = items.length - 1;
        i ??= 0;
        if (i === max) {
            return;
        }

        let c = [2 * i + 1, 2 * i + 2]
            .filter(c => c <= max)
            .map(c => [c, c <= max ? this._comparator(items[i], items[c]) : undefined])
            .filter(([c, dist]) => dist > 0) // only if item[i] - item[c] > 0, thus item[i] > item[c]
            .map(([c, dist]) => c)
            .reduce((rc, c) => {
                if (!rc) {
                    return c;
                }
                if (this._comparator(items[c], items[rc]) < 0) {
                    return c
                }
                return rc
            }, null)

        if (c) {
            [items[i], items[c]] = [items[c], items[i]];
            this._siftDown(c);
        }
    }

    top() {
        return this._items[0];
    }

    copy() {
        return new Heap<T>(this);
    }

    * iterator(): IterableIterator<T> {
        let h = this.copy();
        while (!h.isEmpty()) {
            yield h.pop();
        }
    }

    next() {
        return this.pop();
    }

    toSortedArray() {
        // @ts-ignore
        return [...this.iterator()]
    }

    static heapify<T>(arr: Array<T>, comparator: Function = undefined) {
        let h = new Heap<T>(comparator)
        h.push(...arr);
        return h;
    }

    static merge<T>(a: Heap<T>, b: Heap<T>) {
        let h = new Heap();
        h.push(...a._items, ...b._items);
        return h;
    }

    forEach(fun: Function) {
        // @ts-ignore
        for (let x of this.iterator()) {
            fun(x)
        }
    }

    map(fun: Function) {
        let result = []
        // @ts-ignore
        for (let x of this.iterator()) {
            result.push(fun(x))
        }
        return result;
    }

    find(predicate: Function) {
        // @ts-ignore
        for (let x of this.iterator()) {
            if (predicate(x)) {
                return x;
            }
        }
        return null;
    }

    clear() {
        this._items = [];
    }

    filter(fun: Function) {
        let result = this.copy();
        result.clear();
        // @ts-ignore
        for (let x of this.iterator()) {
            if (fun(x)) {
                result.push(x)
            }
        }
        return result;
    }

}