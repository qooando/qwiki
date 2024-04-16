import {
    Graph,
    makeDependenciesGraph,
    makeDependenciesOrderedList,
    Vertex,
    VisitContext
} from "../../src/core/utils/Graph";
import * as G from "glob";
import * as assert from "assert";

describe('Graph data structure', () => {

    test("New graph", () => {
        let g = new Graph();
        expect(g.size()).toBe(0)
        expect(g.order()).toBe(0)
    })

    test("Add a vertex", () => {
        let g = new Graph()
        let v = g.upsertVertex("a")
        expect(g.vertices.size).toBe(1)
    })

    test("Add a directed edge", () => {
        let g = new Graph()
        let e = g.upsertDirectedEdge("a", "b")
        expect(g.vertices.size).toBe(2)
        expect(g.edges.size).toBe(1)
        expect(e.from.out.size).toBe(1)
        expect(e.from.out.has(e.to.name)).toBeTruthy()
        expect(e.from.out.get(e.to.name)).toBe(e)
        expect(e.to.in.size).toBe(1)
        expect(e.to.in.has(e.from.name)).toBeTruthy()
        expect(e.to.in.get(e.from.name)).toBe(e)
    })

    test("Add a non-directed edge", () => {
        let g = new Graph()
        let e = g.upsertEdge("a", "b")
        expect(g.vertices.size).toBe(2)
        expect(g.edges.size).toBe(2)
    })

    test("Override vertex data", () => {
        let g = new Graph()
        g.upsertVertex("a", 1)
        expect(g.getVertex("a").data).toBe(1)
        g.upsertVertex("a", 2)
        expect(g.getVertex("a").data).toBe(2)
    })

    test("Override edge data", () => {
        let g = new Graph()
        g.upsertDirectedEdge("a", "b", 1)
        expect(g.getEdge("a", "b").data).toBe(1)
        g.upsertDirectedEdge("a", "b", 2)
        expect(g.getEdge("a", "b").data).toBe(2)
    })

    test("Simple acyclic graph", () => {
        let g = new Graph()
        g.upsertDirectedEdge("a", "b")
        g.upsertDirectedEdge("b", "c")
        g.upsertDirectedEdge("a", "d")
        g.upsertDirectedEdge("c", "d")
        expect(g.order()).toBe(4)
        expect(g.size()).toBe(4)
    })

    test("Depth first visit", () => {
        let g = new Graph()
        g.upsertDirectedEdge("a", "b")
        g.upsertDirectedEdge("b", "c")
        g.upsertDirectedEdge("a", "d")
        g.upsertDirectedEdge("c", "d")
        let visit = g.depth("a");

        expect(visit.cycles.length).toBe(0)
        expect(visit.beforeVisit.map((x: Vertex) => x.name)).toEqual("a b c d".split(" "))
        expect(visit.afterVisit.map((x: Vertex) => x.name)).toEqual("d c b a".split(" "))
    })

    test("Walk", () => {
        let g = new Graph()
        g.upsertDirectedEdges([
            ["Alice", "Bob"],
            ["Alice", "Corinna"],
            ["Bob", "Elisa"],
            ["Bob", "Felice"],
            ["Corinna", "Ginevra"],
            ["Corinna", "Hellis"],
        ])

        let picked = new Array<string>();
        let discarded = new Array<string>();

        g.walk("Alice", (node: Vertex, context: VisitContext) => {
            if (picked.length === 0) {
                picked.push(node.name)
            }
            let neighbours = Array.from(node.out.keys()).sort()
            if (neighbours.length === 0) {
                return null;
            }
            let nextName = neighbours.pop();
            discarded.push(...neighbours);
            picked.push(nextName);
            return node.out.get(nextName).to;
        });

        expect(picked).toEqual("Alice Corinna Hellis".split(" "))
        expect(discarded).toEqual("Bob Ginevra".split(" "))
    })
});