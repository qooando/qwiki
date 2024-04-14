import {Base} from "./common/Base";
import {ModulesConfig} from "./models/ApplicationConfig";
import * as assert from "assert";
import {BeanDescriptor, BeanScope} from "./models/BeanDescriptor";
import {Heap} from "./utils/Heap";
import {Bean} from "./common/Bean";
import {Loader} from "./common/Loader";
import {JavascriptLoader} from "./JavascriptLoader";
import {EventNames} from "./constants/EventNames";
import * as path from "path";
import * as fs from "fs";
import {glob} from "glob";
import {mime} from "./utils/Mime";

export class ModuleManager extends Base {
    config: ModulesConfig;
    beans: Map<string, Heap<BeanDescriptor>>;
    loaders: Map<string, Loader>;

    constructor() {
        super();
        this.config = undefined;
        this.beans = new Map<string, Heap<BeanDescriptor>>();
        this.loaders = new Map<string, Loader>;
    }

    initialize(config: ModulesConfig) {
        this.config = config;
        const self = this;

        // manual bootstrap
        this.registerLoaderFromInstance(new JavascriptLoader());

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

    registerLoaderFromInstance(loader: Loader) {
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
        // FIXME do things here?
        return content;
    }

    private loadBeansFromPaths(searchPaths: Array<string>) : BeanDescriptor[] {
        assert(searchPaths)
        let candidateBeans = glob.globSync(this.config.searchPaths, {})
            .map(p => {
                if (!path.isAbsolute(p)) {
                    return path.resolve(p);
                }
                return p;
            })
            .filter(p => fs.statSync(p).isFile())
            .map(p => this.loadContentFromPath(p))
            .flatMap(c => c.getEntries())

        return null;
        // .map(p => self.loadManifest(p, options))
        // .filter(manifest => !!manifest)
        // .filter(options.filter);

        // const searchPaths = this.config.searchPaths || [];
        // this.loadModules(searchPaths);
        // this.ctx.events.emit(ModuleManager.Events.MODULES_AFTER_LOAD)
    }
}