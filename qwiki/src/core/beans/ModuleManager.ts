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
import {Graph} from "../utils/Graph";
import {Strings} from "../utils/Strings";
import {BeanConstants, BeanScope, BeanUtils} from "./BeanUtils";
import {Loader} from "@qwiki/core/loaders/Loader";
import {EventContext} from "@qwiki/core/events/EventManager";
import {TypescriptLoader} from "@qwiki/core/loaders/TypescriptLoader";

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
    async initialize(config: ModulesConfig) {
        this.config = config;
        const self = this;

        // manual bootstrap
        await this.addLoader(new JavascriptLoader());
        await this.addLoader(new TypescriptLoader());

        // register new loaders automatically
        $qw.on(
            Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, BeanUtils.getBeanIdentifierFromClass(Loader)),
            async (ctx: EventContext, bean: Bean, instance: Loader) => {
                await self.addLoader(instance);
            }
        )

        // load all files from search paths using the loader
        await $qw.emit(EventNames.MODULES_BEFORE_LOAD)
        await this.loadBeansFromPaths(this.config.searchPaths);
        await $qw.emit(EventNames.MODULES_AFTER_LOAD)
    }

    /**
     * get the content of a bean given its string identifier
     *
     * @param identifier
     * @param isOptional
     * @param asList if true, returns a list
     * @param keyFun if valorized returns a map
     */
    async getBeanInstance(identifier: (new() => any) | string,
                          isOptional: boolean = false,
                          asList: boolean = false,
                          keyFun: (x: any) => string = undefined): Promise<any> {
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
                return new Map<string, any>(
                    (await Promise.all(descriptors.map(x => x.getInstance())))
                        .map(x => [keyFun(x), x])
                );
            } else {
                return await Promise.all(descriptors.map(x => x.getInstance()));
            }
        } else {
            return await heap.top().getInstance();
        }
    }

    /**
     * Register a bean from its descriptor,
     * this class DOESN'T initialize it!
     *
     * @param descriptor
     */
    async addBean(descriptor: Bean) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        await Promise.all(
            descriptor.getAllIdentifiers().map(
                async (key: string) => {
                    if (!this.beans.has(key)) {
                        this.beans.set(key, new Heap<Bean>(Heap.Comparators.priority))
                    }
                    this.beans.get(key).push(descriptor)
                    await $qw.emit(Strings.format(EventNames.BEAN_REGISTERED_NAME, key), descriptor);
                    return key;
                }
            ));
        return descriptor;
    }

    /**
     * @param loaders
     */
    async addLoader(loader: ILoader): Promise<ILoader> {
        assert(loader)
        assert(loader.supportedMimeTypes)
        loader.supportedMimeTypes.forEach((e: string) => {
            this.log.debug(`Register loader: ${e} → ${loader.constructor.name}`)
            if (this.loaders.has(e)) {
                let current = this.loaders.get(e);
                if (current.constructor.name !== loader.constructor.name) {
                    this.log.warn(`Override loader: ${e} → ${current.constructor.name} with ${loader.constructor.name}`)
                }
            }
            this.loaders.set(e, loader);
        })
        return loader;
    }

    /**
     * Load content from a file leveraging a registered loader
     *
     * @param path
     * @param mimetype
     * @param loader
     */
    async loadContentFromPath(path: string, mimetype: string = undefined, loader: ILoader = undefined) {
        assert(path)
        if (!loader) {
            mimetype ??= mime.getType(path);
            if (!this.loaders.has(mimetype)) {
                throw new Error(`Loader is undefined for mimetype ${mimetype}: ${path}`)
            }
            loader = this.loaders.get(mimetype);
        }
        return await loader.load(path);
    }

    /**
     * Load beans from specified glob paths
     *
     * @param searchPaths
     * @private
     */
    async loadBeansFromPaths(searchPaths: Array<string>): Promise<Bean[]> {
        assert(searchPaths)

        let currentBeans = Array.from(this.beans.values())
            .flatMap(beans => beans.toSortedArray())

        searchPaths = searchPaths.map(x => {
            if (x.startsWith("/")) {
                return x
            }
            return path.join(__dirname, "..", "..", x);
        });

        let files = await glob.glob(searchPaths, {})
            .then(files => files
                .map(p => path.isAbsolute(p) ? p : path.resolve(p))
                .filter(p => fs.statSync(p).isFile())
            );

        let newBeans = (await Promise.all(
            files.flatMap(file =>
                this.loadContentFromPath(file)
                    .then(content =>
                        Object.entries(content)
                            .filter((e: [string, any]) => BeanConstants.BEAN_FIELD_NAME in e[1])
                            .map((e: [string, any]): Bean => {
                                let bean = new Bean(e[1]);
                                bean.path = file;
                                return bean;
                            })
                    )
            )
        )).flatMap(x => x);

        await Promise.all(
            newBeans.map(bean => this.addBean(bean))
        );

        let dependencyGraph = new Graph();

        const ROOT_NODE = "__root__";
        dependencyGraph.upsertVertex(ROOT_NODE);

        currentBeans.forEach(bean => {
            dependencyGraph.upsertVertex(bean.name, bean);
            bean.getAllIdentifiers().filter((i: string) => i !== bean.name)
                .forEach((i: string) => dependencyGraph.upsertDirectedEdge(i, bean.name));
        });

        newBeans.forEach((bean: Bean) => {
            dependencyGraph.upsertDirectedEdge(ROOT_NODE, bean.name)
            dependencyGraph.upsertVertex(bean.name, bean);
            bean.getAllIdentifiers()
                .filter((i: string) => i !== bean.name)
                .forEach((i: string) => dependencyGraph.upsertDirectedEdge(i, bean.name));
        });

        let visitResult = dependencyGraph.depth(ROOT_NODE);

        if (visitResult.cycles.length > 0) {
            visitResult.cycles.forEach(c => {
                c.push(c[0]);
                this.log.error(`Circular dependency found: ${c.map(x => x.name).join(" -> ")}`)
            })
            throw new Error(`Circular dependencies`)
        }

        let newBeansInLoadOrder: Bean[] = visitResult.afterVisit.map(x => x.data).filter(x => !!x);

        this.log.debug(`Load beans: ${newBeansInLoadOrder.map(x => x.name).join(" ")}`)

        await Promise.all(
            newBeansInLoadOrder
                .filter(e => e.scope === BeanScope.SINGLETON)
                .map(e => {
                    this.log.debug(`Init bean: ${e.name.padEnd(40)} from ${e.path}`)
                    return e.getInstance();
                })
        );

        return newBeansInLoadOrder;
    }

}