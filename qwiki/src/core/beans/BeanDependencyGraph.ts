import {Graph} from "@qwiki/core/utils/Graph";
import {Bean} from "@qwiki/core/beans/Bean";

export class BeanDependencyGraph extends Graph {

    static ROOT_NODE: string = "__root__";

    constructor() {
        super();
        this.upsertVertex(BeanDependencyGraph.ROOT_NODE)
    }

    addBean(b: Bean, root: boolean = false) {
        if (root) {
            this.upsertDirectedEdge(BeanDependencyGraph.ROOT_NODE, b.name);
        }
        this.upsertVertex(b.name, b);
        this.upsertDirectedEdges(b.getAllIdentifiers().filter(i => i !== b.name).map(i => [i, b.name]));
        this.upsertDirectedEdges(b.dependsOn.map(i => [b.name, i]));
    }

    addBeans(beans: Bean[], root: boolean = false) {
        beans.forEach(b => this.addBean(b, root));
    }

    getDependencyOrderedList() {
        let visitResult = this.depth(BeanDependencyGraph.ROOT_NODE);
        if (visitResult.cycles.length > 0) {
            visitResult.cycles.forEach(c => {
                c.push(c[0]);
                $qw.log.error(`Circular dependency found: ${c.map(x => x.name).join(" -> ")}`)
            })
            throw new Error(`Circular dependencies`)
        }
        return visitResult.afterVisit;
    }


}