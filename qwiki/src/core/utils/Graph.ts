import * as assert from "assert";

export interface VisitContext {
    cycles: Array<Array<Vertex>> // NOTE: this can be a non-exhaustive list of cycles
    beforeVisit: Array<Vertex>
    afterVisit: Array<Vertex>
}

export class Vertex {
    name: string;
    in: Map<string, DirectedEdge>;
    out: Map<string, DirectedEdge>;
    data: any;

    constructor(name: string, data: any = undefined) {
        this.name = name;
        this.data = data;
        this.in = new Map<string, DirectedEdge>;
        this.out = new Map<string, DirectedEdge>;
    }
}

export class DirectedEdge {
    name: string;
    from: Vertex;
    to: Vertex;
    data: any;

    constructor(from: Vertex, to: Vertex, data: any = undefined) {
        this.name = from.name + "->" + to.name;
        this.from = from;
        this.to = to;
        this.data = data;
    }
}

export class Graph {
    vertices: Map<string, Vertex>;
    edges: Map<string, DirectedEdge>

    constructor() {
        this.vertices = new Map<string, Vertex>;
        this.edges = new Map<string, DirectedEdge>;
    }

    upsertVertex(name: string, data: any = undefined) {
        let node: Vertex = undefined;
        if (!this.vertices.has(name)) {
            node = new Vertex(name);
            this.vertices.set(node.name, node);
        }
        node = this.vertices.get(name);
        node.data = data;
        return node;
    }

    upsertVertices(defs: Array<string>) {
        return defs.map((name: string) => this.upsertVertex(name));
    }

    upsertEdge(from: string, to: string, data: any = undefined) {
        return [
            this.upsertDirectedEdge(from, to, data),
            this.upsertDirectedEdge(to, from, data)
        ]
    }

    upsertDirectedEdge(fromName: string, toName: string, edgeData: any = undefined) {
        let fromVertex = this.upsertVertex(fromName);
        let toVertex = this.upsertVertex(toName);
        let edgeName = fromVertex.name + "->" + toVertex.name;
        let edge: DirectedEdge = undefined;
        if (!this.edges.has(edgeName)) {
            edge = new DirectedEdge(fromVertex, toVertex, edgeData);
            this.edges.set(edge.name, edge);
        } else {
            edge = this.edges.get(edgeName);
        }
        fromVertex.out.set(toName, edge);
        toVertex.in.set(fromName, edge);
        edge.data = edgeData;
        return edge
    }

    upsertDirectedEdges(defs: Array<[string, string]>) {
        return defs.map((e: [string, string]) => {
            return this.upsertDirectedEdge(e[0], e[1]);
        })
    }

    order() {
        return this.vertices.size;
    }

    size() {
        return this.edges.size;
    }

    vertexNames() {
        return Array.from(this.vertices.keys())
    }

    getVertex(name: string) {
        return this.vertices.get(name);
    }

    getEdge(from: string, to: string) {
        return this.edges.get(from + "->" + to)
    }

    isEmpty() {
        return this.order() === 0;
    }

    depth(node: string | Vertex,
          before: ((ancestors: Array<Vertex>, current: Vertex) => boolean) = undefined,
          after: ((ancestors: Array<Vertex>, current: Vertex) => boolean) = undefined,
          filter: ((ancestors: Array<Vertex>, current: Vertex) => boolean) = undefined,
          ancestors: Array<Vertex> = [],
          context: VisitContext = undefined) {
        context ??= {
            cycles: [],
            beforeVisit: [],
            afterVisit: []
        }

        if (this.isEmpty()) {
            throw new Error(`Cannot visit an empty graph`);
        }

        if (typeof node === "string") {
            node = this.vertices.get(node);
        }

        // cycle detection
        const cycleStartIndex = ancestors.indexOf(node);
        if (cycleStartIndex >= 0) {
            context.cycles.push(ancestors.slice(cycleStartIndex));
            return context;
        }

        // skip if already visited
        if (context.beforeVisit.includes(node)) {
            return context;
        }

        context.beforeVisit.push(node);
        before && before(ancestors, node);

        // do children if filter is true or no filter
        if (!filter || filter(ancestors, node)) {
            // visit children
            const newAncestors = ancestors.concat([node,])
            Array.from(node.out.values())
                .map(e => e.to)
                .forEach(to => this.depth(to, before, after, filter, newAncestors, context))
        }

        after && after(ancestors, node);
        context.afterVisit.push(node);

        return context;
    }

    /**
     * Walk
     * @param node
     * @param callback (node, context) => nextNode or null
     * @param context
     */
    walk(node: string | Vertex,
         callback: (node: Vertex, context: VisitContext) => Vertex,
         context: VisitContext = undefined) {
        if (typeof node === "string") {
            node = this.getVertex(node);
        }
        while (node instanceof Vertex) {
            node = callback(node, context);
        }
        return node;
    }

}

export interface MakeDependeniesGraphOptions {
    useItem?(i: any): boolean,

    getId?(i: any): string,

    getChildrenIds?(i: any): Array<string>,

    isRoot?(i: any): boolean,

    rootName?: string
}

export function makeDependenciesGraph(items: Array<any>, options: MakeDependeniesGraphOptions = {}) {
    assert(Array.isArray(items))
    options = Object.assign(options, {
        useItem: (i: any) => true,
        getId: (i: any) => i.id,
        getChildrenIds: (i: any) => i.children,
        isRoot: (i: any) => true, // if is a starter item
        rootName: "__root__",
    });
    let useItem = options.useItem,
        getId = options.getId,
        getChildrenIds = options.getChildrenIds,
        rootName = options.rootName,
        isRoot = options.isRoot;

    const g = new Graph();
    items
        .flatMap(x => Array.isArray(x) ? x : [x])
        .forEach(x => {
            if (!useItem(x)) {
                return;
            }
            const name = getId(x);
            if (!name) {
                throw new Error(`getId function does not return a name`);
            }
            // add x as value to the vertex
            g.upsertVertex(name, {value: x});
            // if node is a root, add special root dependence
            if (isRoot(x)) {
                g.upsertDirectedEdge(rootName, name);
            }
            // add vertexes
            getChildrenIds(x).forEach(otherName => g.upsertDirectedEdge(name, otherName));
        });
    return g;
}


export function makeDependenciesOrderedList(items: Array<any>, options: MakeDependeniesGraphOptions = {}) {
    assert(Array.isArray(items))
    options = Object.assign({
        rootName: "__root__",
    }, options)
    const graph = makeDependenciesGraph(items, options);
    let result = graph.depth(options.rootName).afterVisit;
    result = result.splice(1);
    return result;
}


