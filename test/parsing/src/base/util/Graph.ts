export interface VisitContext {
    previous?: Vertex;
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
        // if (data.toString) {
        //     this.toString = data.toString;
        // }
    }

    toString() {
        let outs = [...this.out.values()].map(x => x.to.name).join(" ").trim();
        return "[" +
            [this.name, outs].filter(x => x.length > 0).join(" → ") +
            "]";
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

    toString() {
        return `${this.from}→${this.to}`
    }
}

export class Graph {
    vertices: Map<string, Vertex>;
    edges: Map<string, DirectedEdge>

    constructor() {
        this.vertices = new Map<string, Vertex>;
        this.edges = new Map<string, DirectedEdge>;
    }

    upsertVertex(vertexName: string, vertexData: any = undefined) {
        let node: Vertex = undefined;
        if (!this.vertices.has(vertexName)) {
            node = new Vertex(vertexName);
            this.vertices.set(node.name, node);
        }
        node = this.vertices.get(vertexName);
        if (vertexData) {
            node.data = vertexData;
        }
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
        if (edgeData) {
            edge.data = edgeData;
        }
        return edge
    }

    upsertDirectedEdges(defs: Array<[string, ...string[]]>) {
        return defs.map((e: [string, ...string[]]) => {
            e.slice(1).forEach(to => {
                return this.upsertDirectedEdge(e[0], to)
            });
        })
    }

    upsertDirectedPath(...defs: string[]) {
        let edges = [];
        for (let i = 1; i < defs.length; i++) {
            edges.push(this.upsertDirectedEdge(defs[i - 1], defs[i]));
        }
        return edges;
    }

    removeEdge(fromName: string, toName: string) {
        return this.removeDirectedEdge(fromName, toName)
            || this.removeDirectedEdge(toName, fromName);
    }

    removeDirectedEdge(fromName: string, toName: string) {
        let fromVertex = this.upsertVertex(fromName);
        let edgeName = fromVertex.name + "->" + toName;
        return fromVertex.out.delete(edgeName);
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
            context.previous = node;
            node = callback(node, context);
        }
        return node;
    }

}
