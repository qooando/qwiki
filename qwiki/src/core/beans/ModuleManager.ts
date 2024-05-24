import {Base} from "../base/Base";
import {ModulesConfig} from "../config/ApplicationConfig";
import {Bean} from "./Bean";
import {Heap} from "../utils/Heap";
import {EventNames} from "../events/EventNames";
import * as path from "path";
import {Strings} from "../utils/Strings";
import {BeanScope, BeanUtils} from "./BeanUtils";
import {ModuleScanner} from "@qwiki/core/beans/scanners/ModuleScanner";
import {JavascriptScanner} from "@qwiki/core/beans/scanners/JavascriptScanner";
import {BeanDependencyGraph} from "@qwiki/core/beans/BeanDependencyGraph";
import {Arrays} from "@qwiki/core/utils/Arrays";
import {fileURLToPath} from "node:url";
import {dirname} from "node:path";
import {assert} from "@qwiki/core/utils/common";
import {ClassConstructor, FilterFunction, KeyFunction} from "@qwiki/core/utils/Types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface FindBeanOptions {
    isOptional?: boolean,
    asList?: boolean,
    asMap?: boolean,
    filterFun?: FilterFunction<any>,
    keyFun?: KeyFunction<any>
    constructorArgs?: any[]
}

/**
 * Load files and manage beans
 */
export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<Bean>>;
    modules: Map<string, any>;
    scanners: Map<string, ModuleScanner>;

    constructor() {
        super();
        this.config = undefined;
        this.beans = new Map<string, Heap<Bean>>();
        this.scanners = new Map<string, ModuleScanner>;
    }

    /**
     * Initialize module manager from a configuration object
     *
     * @param config
     */
    async initialize(config: ModulesConfig) {
        this.config = config;
        const self = this;

        // register new loaders automatically
        $qw.on(
            Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, BeanUtils.getBeanIdentifierFromClass(ModuleScanner)),
            async (bean: Bean, instance: ModuleScanner) => {
                await self.registerScanner(instance);
            }
        );

        // manual bootstrap
        await this.registerBeans(
            [
                new Bean(JavascriptScanner),
                // new Bean(TypescriptScanner),
            ],
            true
        )

        // load all files from search paths using the loader
        await $qw.emit(EventNames.MODULES_BEFORE_LOAD)
        await this.registerBeansFromPaths(this.config.searchPaths);
        await $qw.emit(EventNames.MODULES_AFTER_LOAD)
    }

    /**
     * @param identifier
     * @param options
     */
    async findBeans(identifier: ClassConstructor<any> | string, options: FindBeanOptions = {}): Promise<any> {
        assert(identifier)

        const isOptional = options.isOptional ?? false;
        const asList = options.asList ?? !!options.filterFun ?? false;
        const asMap = options.asMap ?? !!options.keyFun ?? false;
        const filterFun = options.filterFun ?? ((x: any) => true);
        const keyFun = options.keyFun;

        if (typeof identifier !== "string") {
            identifier = BeanUtils.getBeanIdentifierFromClass(identifier);
        }

        const beanExists = this.beans.has(identifier);

        if (!beanExists) {
            if (!isOptional) {
                throw new Error(`Bean not found: ${identifier}`)
            } else if (asList) {
                return [];
            } else if (asMap) {
                return new Map();
            } else {
                return null;
            }
        }

        const beansHeap = this.beans.get(identifier);

        if (!asList && !asMap) {
            return await beansHeap.top();
        }

        let beans = beansHeap.toSortedArray();

        if (filterFun) {
            beans = beans.filter(filterFun);
        }

        if (asList) {
            return beans;
        }
        if (asMap) {
            if (!keyFun) {
                throw new Error(`Bean required as map but no key fun is specified: ${identifier}`)
            }
            return new Map<string, any>(
                beans.flatMap(bean => {
                    let keys = keyFun(bean);
                    if (!keys) {
                        throw new Error(`Invalid key function, it returns an invalid value: ${keys}`);
                    }
                    if (typeof keys === "string") {
                        return [[keys, bean]];
                    } else if (Array.isArray(keys)) {
                        if (!keys.length) {
                            throw new Error(`Invalid key function, it returns an empty array: ${keys}`);
                        }
                        return keys.map(k => [k, bean]);
                    } else {
                        throw new Error(`Invalid key function, keys should be string | string[]: ${keys}`);
                    }
                })
            )
        }
        throw new Error(`Invalid branch. This code should never execute.`)
    }

    /**
     * get the content of a bean given its string identifier
     *
     * @param identifier
     * @param options
     */
    async getBeanInstances(identifier: ClassConstructor<any> | string, options: FindBeanOptions = {}): Promise<any> {
        assert(identifier)

        const isOptional = options.isOptional ?? false;
        const asList = options.asList ?? !!options.filterFun ?? false;
        const asMap = options.asMap ?? !!options.keyFun ?? false;
        const filterFun = options.filterFun ?? ((x: any) => true);
        const keyFun = options.keyFun;
        const constructorArgs = options.constructorArgs ?? [];

        if (typeof identifier !== "string") {
            identifier = BeanUtils.getBeanIdentifierFromClass(identifier);
        }

        const beanExists = this.beans.has(identifier);

        if (!beanExists) {
            if (!isOptional) {
                throw new Error(`Bean not found: ${identifier}`)
            } else if (asList) {
                return [];
            } else if (asMap) {
                return new Map();
            } else {
                return null;
            }
        }

        const beansHeap = this.beans.get(identifier);
        const constructorArgsIsArray = Array.isArray(constructorArgs)
        if (!asList && !asMap) {
            return await (constructorArgsIsArray ? beansHeap.top().getInstance(...constructorArgs) : beansHeap.top().getInstance(constructorArgs));
        }

        let beans = beansHeap.toSortedArray();
        // if (filterFun) {
        //     beans = beans.filter(filterFun);
        // }
        // let instances = await Promise.all(
        //     beans.map(x => constructorArgs ? x.getInstance(...constructorArgs) : x.getInstance(constructorArgsIsArray))
        // );
        let instances = []
        for (let x of beans) {
            let r = await (constructorArgs ? x.getInstance(...constructorArgs) : x.getInstance(constructorArgsIsArray))
            instances.push(r);
        }
        if (filterFun) {
            instances = instances.filter(filterFun);
        }

        if (asList) {
            return instances;
        }
        if (asMap) {
            if (!keyFun) {
                throw new Error(`Bean required as map but no key fun is specified: ${identifier}`)
            }
            return new Map<string, any>(
                instances.flatMap(instance => {
                    let keys = keyFun(instance);
                    if (!keys) {
                        throw new Error(`Invalid key function, it returns an invalid value: ${keys}`);
                    }
                    if (typeof keys === "string") {
                        return [[keys, instance]];
                    } else if (Array.isArray(keys)) {
                        if (!keys.length) {
                            throw new Error(`Invalid key function, it returns an empty array: ${keys}`);
                        }
                        return keys.map(k => [k, instance]);
                    } else {
                        throw new Error(`Invalid key function, keys should be string | string[]: ${keys}`);
                    }
                })
            )
        }
        throw new Error(`Invalid branch. This code should never execute.`)
    }

    async registerBeans(descriptors: Bean[], initialize: boolean = false) {
        return Promise.all(descriptors.map(bean => this.registerBean(bean, initialize)));
    }

    /**
     * Register a bean from its descriptor,
     * this class DOESN'T initialize it!
     *
     * @param descriptor
     * @param initialize
     */
    async registerBean(descriptor: Bean, initialize: boolean = false) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        this.log.debug(`Add bean: ${descriptor.name.padEnd(40)} ${descriptor.path ? "from " + path.relative(process.cwd(), descriptor.path) : ""}`)
        if (this.beans.has(descriptor.name)) {
            throw new Error(`Bean class ${descriptor.clazz.name} already registered`)
        }
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
        if (initialize && descriptor.scope === BeanScope.SINGLETON) {
            await descriptor.getInstance();
        }
        return descriptor;
    }

    hasBean(identifier: string) {
        return this.beans.has(identifier) && this.beans.get(identifier).size() > 0;
    }

    /**
     * @param scanner
     */
    async registerScanner(scanner: ModuleScanner): Promise<ModuleScanner> {
        assert(scanner)
        scanner.supportedExtensions.forEach((extension: string) => {
            this.log.debug(`Add scanner: ${extension} → ${scanner.constructor.name}`);
            if (this.scanners.has(extension)) {
                let current = this.scanners.get(extension);
                if (current.constructor.name !== scanner.constructor.name) {
                    this.log.warn(`Override scanner: ${extension} → ${current.constructor.name} with ${scanner.constructor.name}`)
                }
            }
            this.scanners.set(extension, scanner);
        })
        return scanner;
    }

    /**
     * Load beans from specified glob paths
     *
     * @param searchPaths
     * @param scanners
     * @private
     */
    async registerBeansFromPaths(searchPaths: string[] = undefined, scanners: ModuleScanner[] = undefined): Promise<Bean[]> {
        searchPaths ??= this.config.searchPaths;
        scanners ??= Array.from(this.scanners.values());
        searchPaths = searchPaths.map(x => x.startsWith("/") ? x : path.join(__dirname, "..", "..", x));

        let depGraph = new BeanDependencyGraph();

        // @ts-ignore
        let currentBeans = Arrays.distincts(
            Array.from(this.beans.values())
                .flatMap(x => x._items),
            BeanUtils.compareName
        );
        depGraph.addBeans(currentBeans);

        // use scanners to find new candidate beans
        let scannersToVisit: ModuleScanner[][] = [scanners];
        let candidateBeans: Bean[] = [];
        while (scannersToVisit.length > 0) {
            let newCandidateBeans = await Promise.all(scannersToVisit.pop()
                .map(scanner => scanner.findBeansByPaths(...searchPaths))
            )
                .then(b => b.flatMap(x => x))
                .then(b => b.filter(x => !this.beans.has(x.name)))
                .then(b => b.filter(x => x.loadCondition ? x.loadCondition() : true))
                .then(b => Arrays.distincts(b, BeanUtils.compareName))
                .then(b => this.registerBeans(b)); // NOTE, from here on beans are available to others for autowiring
            depGraph.addBeans(newCandidateBeans, true);
            candidateBeans.push(...newCandidateBeans);

            let newScanners = await Promise.all(
                newCandidateBeans
                    .filter(b => b.instances.length === 0)
                    .filter(b => b.clazz.prototype instanceof ModuleScanner)
                    .map(b => b.getInstance()) // scanners should depends only on already available beans
                // FIXME if a scanner depends on another one? (e.g. explicitly set in dependsOn? will it works?)
            );

            if (newScanners.length > 0) {
                scannersToVisit.push(newScanners);
                scanners.push(...newScanners)
            }
        }

        let newBeansInLoadOrder: Bean[] = depGraph.getDependencyOrderedList()
            .map(x => x.data).filter(x => !!x);

        // this.log.debug(`Load beans: ${newBeansInLoadOrder.map(x => x.name).join(" ")}`)

        for (let bean of newBeansInLoadOrder.filter(e => e.scope === BeanScope.SINGLETON)) {
            await bean.getInstance();
        }

        return newBeansInLoadOrder;
    }

}