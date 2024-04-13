import {Heap, Prioritized} from "../../src/core/utils/Heap";

describe('Heap data structure', () => {

    test('Sequential insert', () => {
        let a = new Heap<number>()
        a.push(3);
        expect(a.top()).toBe(3);
        a.push(9);
        expect(a.top()).toBe(3);
        expect(a._items).toStrictEqual([3, 9]);
        a.push(1);
        expect(a.top()).toBe(1);
        expect(a._items).toStrictEqual([1, 9, 3]);
        a.push(5);
        expect(a.top()).toBe(1);
        expect(a._items).toStrictEqual([1, 5, 3, 9]);
        a.push(1);
        expect(a.top()).toBe(1);
        expect(a._items).toStrictEqual([1, 1, 3, 9, 5]);
        a.push(-1);
        expect(a.top()).toBe(-1);
        expect(a._items).toStrictEqual([-1, 1, 1, 9, 5, 3]);
    });

    test('Sequential pop', () => {
        let a = new Heap<number>(),
            b = [3, 1, 2, 5, 6];
        a.push(...b);
        expect(a._items).toStrictEqual([1, 3, 2, 5, 6]);
        expect(a.pop()).toBe(1);
        expect(a._items).toStrictEqual([2, 3, 6, 5]);
        expect(a.pop()).toBe(2);
        expect(a._items).toStrictEqual([3, 5, 6]);
        expect(a.pop()).toBe(3);
        expect(a._items).toStrictEqual([5, 6]);
        expect(a.pop()).toBe(5);
        expect(a._items).toStrictEqual([6]);
        expect(a.pop()).toBe(6);
        expect(a._items).toStrictEqual([]);

    });

    test('Max comparator', () => {
        let a: Heap<number> = new Heap<number>(Heap.Comparators.max),
            b: number[] = [3, 1, 2, -5, 2];
        a.push(...b);
        console.log(a._items)
        expect(a._items).toStrictEqual([3, 2, 2, -5, 1]);
        console.log(a.toSortedArray())
        expect(a.toSortedArray()).toStrictEqual([3, 2, 2, 1, -5])
    });

    test('Priority comparator must return smaller priorities first', () => {
        let a: Heap<Prioritized> = new Heap<Prioritized>(Heap.Comparators.priority),
            b: Prioritized[] = [
                {priority: 5},
                {priority: 3},
                {priority: 1},
                {priority: 7},
                {priority: -3},
            ];
        a.push(...b);
        expect(a.toSortedArray()).toStrictEqual([b[4], b[2], b[1], b[0], b[3]])
    });

});