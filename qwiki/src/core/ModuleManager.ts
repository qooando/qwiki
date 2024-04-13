import {Base} from "./common/Base";
import {ModulesConfig} from "./models/ApplicationConfig";
import * as assert from "assert";
import {BeanDescriptor, BeanScope} from "./models/BeanDescriptor";
import {Heap} from "./utils/Heap";
import {Bean} from "./common/Bean";

export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<BeanDescriptor>>;

    // loadersByMimeType: Map<string, Loader>;
    // modules: Map<string, Module>; // apiVersion|kindAndName|kind -> Module

    constructor() {
        super();
        this.config = undefined;
        this.beans = new Map<string, Heap<BeanDescriptor>>();
    }

    initialize(config: ModulesConfig) {
        this.config = config;
        const self = this;

        //
        // /*
        //  * Manually boostrap dependencies for preload
        //  */
        // this._defaultModuleLoader = require("./loaders/JavascriptModuleLoader");
        //
        // if (this._defaultModuleLoader.init) {
        //     this._defaultModuleLoader.init(this.ctx);
        // }
        //
        // Object.assign(this.loadersByMimeTypes, Object.fromEntries(
        //     this._defaultModuleLoader.__qwiki__.mimeTypes.map(
        //         mimeType => [mimeType, {
        //             content: this._defaultModuleLoader
        //         }]
        //     )
        // ));
        //
        // /*
        //  * Automatically register new modules of `moduleLoader` kind in `loadersByMimeTypes` cache
        //  */
        // this.ctx.events.on(ModuleManager.Events.NEW_MODULE_REGISTERED_WITH_KIND_ + "MODULELOADER",
        //     (ctx, manifest) => {
        //         assert(manifest.kind === "moduleLoader");
        //         assert(manifest.mimeTypes && manifest.mimeTypes.length, `Missing mimeTypes in module ${manifest.apiVersion}`)
        //         manifest.mimeTypes.forEach(mimeType => {
        //             self.loadersByMimeTypes[mimeType] = manifest
        //         });
        //     })
        //
        // this.ctx.events.emit(ModuleManager.Events.MODULES_BEFORE_PRELOAD);
        //
        // /*
        //  * Preload specific files before any other module
        //  */
        // [
        //     "./loaders/JavascriptModuleLoader.js"
        // ]
        //     .map(x => path.join(__dirname, x))
        //     .map(x => this.loadModule(x));
        //
        // this.ctx.events.emit(ModuleManager.Events.MODULES_AFTER_PRELOAD)
        // this.ctx.events.emit(ModuleManager.Events.MODULES_BEFORE_LOAD)
        //
        // /*
        //  * Load all modules in search paths with dependencies resolution
        //  */
        // const searchPaths = this.config.searchPaths || [];
        // this.loadModules(searchPaths);
        // this.ctx.events.emit(ModuleManager.Events.MODULES_AFTER_LOAD)
    }

    /**
     * get the content of a bean given its identifier
     * if a kind is provided, it returns a list of all beans of the specified kind -> ordered or not?
     * if a name is provided, it returns only the specified name, if multiple beans have the same name -> use "primary" or an order?
     * @param identifier
     * @param isOptional
     * @param asList
     */
    require(identifier: string, isOptional: boolean = true, asList: boolean = false): any {
        assert(identifier)
        assert(isOptional)
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
            return descriptors.map(this.requireFromDescriptor);
        } else {
            return this.requireFromDescriptor(heap.top());
        }
    }

    requireFromDescriptor(descriptor: BeanDescriptor) {
        assert(descriptor)
        switch (descriptor.scope) {
            case BeanScope.PROTOTYPE:
                assert(descriptor.clazz);
                assert(descriptor.instances);
                let instance = this.autoconstruct(descriptor.clazz);
                descriptor.instances.push(instance);
                return instance;
            case BeanScope.SINGLETON:
                assert(descriptor.instances);
                if (descriptor.instances.length == 0) {
                    let instance = this.autoconstruct(descriptor.clazz);
                    descriptor.instances.push(instance);
                }
                return descriptor.instances.at(0);
            default:
                throw new Error(`Not implemented bean scope: ${descriptor.scope}`)
        }
    }

    /**
     * construct a class instance, autoresolve all constructor arguments from other beans
     *
     * @param clazz
     */
    autoconstruct<T>(clazz: new () => T) {
        assert(clazz);
        // FIXME autowire arguments, find bean descriptor for clazz ?
        return new clazz();
    }

    registerBeanFromDescriptor(descriptor: BeanDescriptor) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        [
            "class:" + descriptor.clazz.name,
            descriptor.name,
        ].forEach(
            (key: string) => {
                if (!this.beans.has(key)) {
                    this.beans.set(key, new Heap<BeanDescriptor>(Heap.Comparators.priority))
                }
                this.beans.get(key).push(descriptor)
            }
        );
        return descriptor;
    }

    registerBeanFromInstance(
        instance: object,
        priority: number = 0
    ) {
        assert(instance)
        let d: BeanDescriptor = {
            clazz: instance.constructor,
            name: instance.constructor.name.at(0).toLowerCase() + instance.constructor.name.slice(1),
            priority: priority,
            scope: BeanScope.SINGLETON,
            lazy: false,
            instances: [instance]
        }
        return this.registerBeanFromDescriptor(d);
    }

    registerBeanFromClass<T>(
        clazz: new () => T,
        scope: BeanScope = BeanScope.SINGLETON,
        lazy: boolean = false,
        priority: number = 0
    ) {
        assert(clazz);
        let d: BeanDescriptor = {
            clazz: clazz,
            name: clazz.name.at(0).toLowerCase() + clazz.name.slice(1),
            priority: priority,
            scope: scope,
            lazy: lazy,
            instances: new Array<any>()
        }
        if (!lazy && scope === BeanScope.SINGLETON) {
            d.instances.push(this.autoconstruct(clazz))
        }
        return this.registerBeanFromDescriptor(d);
    }


}