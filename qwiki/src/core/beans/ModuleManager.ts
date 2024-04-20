import {Base} from "../base/Base";
import {ModulesConfig} from "../config/ApplicationConfig";
import * as assert from "assert";
import {Bean} from "./Bean";
import {Heap} from "../utils/Heap";
import {ILoader} from "../loaders/ILoader";
import {JavascriptLoader} from "../loaders/JavascriptLoader";
import {EventNames} from "../events/EventNames";
import * as path from "path";
import * as fs from "fs";
import {glob} from "glob";
import {mime} from "../utils/Mime";
import {Graph, sortDependenciesByLoadOrder} from "../utils/Graph";
import {Strings} from "../utils/Strings";
import {BeanConstants, BeanScope, BeanUtils} from "./BeanUtils";

/**
 * Load files and manage beans
 */
export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<Bean>>;
    modules: Map<string, any>;
    loaders: Map<string, ILoader>;

    constructor() {
        super();
        this.config = undefined;
        this.beans = new Map<string, Heap<Bean>>();
        this.loaders = new Map<string, ILoader>;
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
     * get the content of a bean given its string identifier
     *
     * @param identifier
     * @param isOptional
     * @param asList if true, returns a list
     * @param keyFun if valorized returns a map
     */
    getBeanInstance(identifier: (new() => any) | string,
                    isOptional: boolean = false,
                    asList: boolean = false,
                    keyFun: (x: any) => string = undefined): any {
        assert(identifier)
        assert(typeof isOptional === "boolean")
        assert(typeof asList === "boolean")

        asList = asList || keyFun !== undefined;

        if (typeof identifier !== "string") {
            identifier = BeanUtils.getBeanIdentifierFromClass(identifier);
        }

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
            if (keyFun) {
                return new Map<string, any>(descriptors
                    .map(x => x.getInstance())
                    .map(x => [keyFun(x), x]));
            } else {
                return descriptors.map(x => x.getInstance());
            }
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
        descriptor.getAllIdentifiers().forEach(
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
    addLoader(loader: ILoader) {
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
    loadContentFromPath(path: string, mimetype: string = undefined, loader: ILoader = undefined) {
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

        let dependencyGraph = new Graph();
        const ROOT_NODE = "__root__";
        dependencyGraph.upsertVertex(ROOT_NODE);
        Array.from(this.beans.values())
            .flatMap(beans => beans.toSortedArray())
            .forEach(bean => {
                dependencyGraph.upsertVertex(bean.name, bean);
                bean.getAllIdentifiers()
                    .filter((i: string) => i !== bean.name)
                    .forEach((i: string) => dependencyGraph.upsertDirectedEdge(i, bean.name));
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
                        .map(bean => this.addBean(bean))
                        .map(bean => {
                            dependencyGraph.upsertDirectedEdge(ROOT_NODE, bean.name)
                            dependencyGraph.upsertVertex(bean.name, bean);
                            bean.getAllIdentifiers()
                                .filter((i: string) => i !== bean.name)
                                .forEach((i: string) => dependencyGraph.upsertDirectedEdge(i, bean.name));
                            return bean;
                        })
                })

        let visitResult = dependencyGraph.depth(ROOT_NODE);

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