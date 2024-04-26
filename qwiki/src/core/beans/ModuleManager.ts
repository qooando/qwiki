import {Base} from "../base/Base";
import {ModulesConfig} from "../config/ApplicationConfig";
import * as assert from "assert";
import {Bean} from "./Bean";
import {Heap} from "../utils/Heap";
import {EventNames} from "../events/EventNames";
import * as path from "path";
import {Strings} from "../utils/Strings";
import {BeanScope, BeanUtils} from "./BeanUtils";
import {EventContext} from "@qwiki/core/events/EventManager";
import {ModuleScanner} from "@qwiki/core/beans/ModuleScanner";
import {JavascriptScanner} from "@qwiki/core/scanners/JavascriptScanner";
import {TypescriptScanner} from "@qwiki/core/scanners/TypescriptScanner";
import {BeanDependencyGraph} from "@qwiki/core/beans/BeanDependencyGraph";
import {Arrays} from "@qwiki/core/utils/Arrays";
import * as fs from "node:fs";

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
            async (ctx: EventContext, bean: Bean, instance: ModuleScanner) => {
                await self.addScanner(instance);
            }
        );

        // manual bootstrap
        await this.addBeans(
            [
                new Bean(JavascriptScanner),
                new Bean(TypescriptScanner),
            ],
            true
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

    async addBeans(descriptors: Bean[], initialize: boolean = false) {
        return Promise.all(descriptors.map(bean => this.addBean(bean, initialize)));
    }

    /**
     * Register a bean from its descriptor,
     * this class DOESN'T initialize it!
     *
     * @param descriptor
     * @param initialize
     */
    async addBean(descriptor: Bean, initialize: boolean = false) {
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

    /**
     * @param scanner
     */
    async addScanner(scanner: ModuleScanner): Promise<ModuleScanner> {
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
    async loadBeansFromPaths(searchPaths: string[] = undefined, scanners: ModuleScanner[] = undefined): Promise<Bean[]> {
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
                .then(b => Arrays.distincts(b, BeanUtils.compareName))
                .then(b => this.addBeans(b)); // NOTE, from here on beans are available to others for autowiring
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
            }
        }

        let newBeansInLoadOrder: Bean[] = depGraph.getDependencyOrderedList()
            .map(x => x.data).filter(x => !!x);

        // this.log.debug(`Load beans: ${newBeansInLoadOrder.map(x => x.name).join(" ")}`)

        await Promise.all(
            newBeansInLoadOrder
                .filter(e => e.scope === BeanScope.SINGLETON)
                .map(e => {
                    // this.log.debug(`Init bean: ${e.name.padEnd(40)} from ${e.path}`)
                    return e.getInstance();
                })
        );

        return newBeansInLoadOrder;
    }

}