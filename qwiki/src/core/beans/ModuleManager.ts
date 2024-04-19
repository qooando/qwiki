import {Base} from "../base/Base";
import {ModulesConfig} from "../config/ApplicationConfig";
import * as assert from "assert";
import {Bean} from "./Bean";
import {Heap} from "../utils/Heap";
import {Loader} from "../loaders/Loader";
import {JavascriptLoader} from "../loaders/JavascriptLoader";
import {EventNames} from "../events/EventNames";
import * as path from "path";
import * as fs from "fs";
import {glob} from "glob";
import {mime} from "../utils/Mime";
import {Graph, sortDependenciesByLoadOrder} from "../utils/Graph";
import {Strings} from "../utils/Strings";
import ConstructorArgsType = jest.ConstructorArgsType;
import {AutowiredField} from "./Autowire";
import {BeanConstants, BeanScope} from "./BeanConstants";

/**
 * Load files and manage beans
 */
export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<Bean>>;
    loaders: Map<string, Loader>;

    constructor() {
        super();
        this.config = undefined;
        this.beans = new Map<string, Heap<Bean>>();
        this.loaders = new Map<string, Loader>;
    }

    /**
     * Initialize module manager from a configuration object
     *
     * @param config
     */
    initialize(config: ModulesConfig) {
        this.config = config;
        const self = this;

        // manual bootstrap
        this.addLoader(new JavascriptLoader());

        // load all files from search paths using the loader
        $qw.emitSync(EventNames.MODULES_BEFORE_LOAD)
        this.loadBeansFromPaths(this.config.searchPaths);
        $qw.emitSync(EventNames.MODULES_AFTER_LOAD)
    }

    /**
     * get the content of a bean given its identifier
     * if a kind is provided, it returns a list of all beans of the specified kind -> ordered or not?
     * if a name is provided, it returns only the specified name, if multiple beans have the same name -> use "primary" or an order?
     * @param identifier
     * @param isOptional
     * @param asList
     */
    require(identifier: string, isOptional: boolean = false, asList: boolean = false): any {
        assert(identifier)
        assert(typeof isOptional === "boolean")
        assert(typeof asList === "boolean")
        if (!this.beans.has(identifier)) {
            if (!isOptional) {
                throw new Error(`Bean not found: ${identifier}`)
            } else {
                return asList ? [] : null;
            }
        }
        const heap = this.beans.get(identifier);
        if (asList) {
            let descriptors = heap.toSortedArray();
            return descriptors.map(x => x.getInstance());
        } else {
            return heap.top().getInstance();
        }
    }

    /**
     * Register a bean from its descriptor,
     * this class DOESN'T initialize it!
     *
     * @param descriptor
     */
    addBean(descriptor: Bean) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        [
            "class:" + descriptor.clazz.name, // common to different beans ?,
            ...(descriptor.groups ?? []),
            descriptor.name, // should be unique
        ].forEach(
            (key: string) => {
                if (!this.beans.has(key)) {
                    this.beans.set(key, new Heap<Bean>(Heap.Comparators.priority))
                }
                this.beans.get(key).push(descriptor)
                $qw.emitSync(Strings.format(EventNames.BEAN_REGISTERED_NAME, key), descriptor);
            }
        );
        return descriptor;
    }

    /**
     * Register a new loader
     *
     * @param loader
     */
    addLoader(loader: Loader) {
        assert(loader)
        assert(loader.supportedMimeTypes)
        loader.supportedMimeTypes.forEach((e: string) => {
            this.log.debug(`Register loader ${loader.constructor.name} for mimetype ${e}`)
            if (this.loaders.has(e)) {
                this.log.warn(`Override loader for mimetype ${e} with loader ${loader.constructor.name}`)
            }
            this.loaders.set(e, loader);
        })
    }

    /**
     * Load content from a file leveraging a registered loader
     *
     * @param path
     * @param mimetype
     * @param loader
     */
    loadContentFromPath(path: string, mimetype: string = undefined, loader: Loader = undefined) {
        assert(path)
        if (!loader) {
            mimetype ??= mime.getType(path);
            if (!this.loaders.has(mimetype)) {
                this.log.warn(`Loader not found for mimetype ${mimetype}: ${path}`)
            }
            loader = this.loaders.get(mimetype);
        }
        let content = loader.load(path);
        return content;
    }

    /**
     * Load beans from specified glob paths
     *
     * @param searchPaths
     * @private
     */
    loadBeansFromPaths(searchPaths: Array<string>): Bean[] {
        assert(searchPaths)
        searchPaths = searchPaths.map(x => {
            if (x.startsWith("/")) {
                return x
            }
            return path.join(__dirname, "..", "..", x);
        });

        let newBeans: Array<Bean> =
            glob.globSync(searchPaths, {})
                .map(p => {
                    if (!path.isAbsolute(p)) {
                        return path.resolve(p);
                    }
                    return p;
                })
                .filter(p => fs.statSync(p).isFile())
                .flatMap(p => {
                    return Object.entries(this.loadContentFromPath(p))
                        .filter((e: [string, any]) => BeanConstants.BEAN_FIELD_NAME in e[1])
                        .map((e: [string, any]): Bean => {
                            let bean = new Bean(e[1]);
                            bean.path = p;
                            return bean;
                        })
                        .map(x => this.addBean(x));
                })


        /*
         dependencies resolution
         1. add all beans to graph
         2. add dependency edges for new beans
         3. find cycles
         4. initialize singletons
         */
        let graph = new Graph();
        const ROOT_NODE = "__root__";
        graph.upsertVertex(ROOT_NODE);

        newBeans.forEach(bean => {
            graph.upsertVertex(bean.name, bean);
            graph.upsertDirectedEdge("class:" + bean.clazz.name, bean.name);
            bean.groups.forEach(group => {
                graph.upsertDirectedEdge(group, bean.name)
            })
            bean.dependsOn.forEach(dep => {
                graph.upsertDirectedEdge(bean.name, dep)
            })
            graph.upsertDirectedEdge(ROOT_NODE, bean.name)
        })

        let visitResult = graph.depth(ROOT_NODE);

        if (visitResult.cycles.length > 0) {
            visitResult.cycles.forEach(c => {
                c.push(c[0]);
                this.log.error(`Circular dependency found: ${c.map(x => x.name).join(" -> ")}`)
            })
            throw new Error(`Circular dependencies`)
        }

        let newBeansInLoadOrder: Bean[] = visitResult.afterVisit.map(x => x.data).filter(x => !!x);

        newBeansInLoadOrder
            .filter(e => e.scope === BeanScope.SINGLETON)
            .forEach(e => {
                this.log.debug(`Init bean: ${e.name.padEnd(40)} from ${e.path}`)
                e.getInstance();
            })

        return newBeansInLoadOrder;
    }

}