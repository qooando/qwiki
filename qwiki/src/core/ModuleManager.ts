import {Base} from "./common/Base";
import {ModulesConfig} from "./models/ApplicationConfig";
import * as assert from "assert";
import {BeanDescriptor} from "./models/BeanDescriptor";
import {Heap} from "./utils/Heap";

export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<BeanDescriptor>>;

    // loadersByMimeType: Map<string, Loader>;
    // modules: Map<string, Module>; // apiVersion|kindAndName|kind -> Module

    constructor() {
        super();
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
     * @param optional
     */
    require(identifier: string, optional: boolean = true) {
        throw new Error("Not implemented");
    }

    autowire(fun: Function) {
        throw new Error("Not implemented") ;
    }

    registerBeanFromDescriptor(descriptor: BeanDescriptor) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        [descriptor.clazz, descriptor.name].forEach(
            (key: string) => {
                if (!this.beans.has(key)) {
                    this.beans.set(key, new Heap<BeanDescriptor>(Heap.Comparators.priority))
                }
                this.beans.get(key).push(descriptor)
            }
        );
    }

}