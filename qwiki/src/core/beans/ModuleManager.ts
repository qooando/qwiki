import {Base} from "../base/Base";
import {ModulesConfig} from "../config/ApplicationConfig";
import * as assert from "assert";
import {BeanDescriptor} from "./BeanDescriptor";
import {Heap} from "../utils/Heap";
import {Loader} from "../loaders/Loader";
import {JavascriptLoader} from "../loaders/JavascriptLoader";
import {EventNames} from "../events/EventNames";
import * as path from "path";
import * as fs from "fs";
import {glob} from "glob";
import {mime} from "../utils/Mime";
import {BeanScope} from "./BeanScope";
import {sortDependenciesByLoadOrder} from "../utils/Graph";
import {Strings} from "../utils/Strings";
import ConstructorArgsType = jest.ConstructorArgsType;
import {AutowiredField} from "./Autowire";

/**
 * Load files and manage beans
 */
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
        assert(isOptional !== undefined)
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

    /**
     * Load bean instance from a descriptor
     * @param descriptor
     */
    requireFromDescriptor(descriptor: BeanDescriptor) {
        assert(descriptor)
        descriptor.instances ??= []
        switch (descriptor.scope) {
            case BeanScope.PROTOTYPE:
                assert(descriptor.clazz);
                assert(descriptor.instances);
                let instance = this.autoconstruct(descriptor.clazz);
                descriptor.instances ??= new Array<any>();
                descriptor.instances.push(instance);
                $qw.emitSync(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, descriptor.name), descriptor, instance);
                this.log.debug(`New instance of bean ${descriptor.name}`)
                return instance;
            case BeanScope.SINGLETON:
                assert(descriptor.instances);
                if (descriptor.instances.length == 0) {
                    let instance = this.autoconstruct(descriptor.clazz);
                    descriptor.instances ??= new Array<any>();
                    descriptor.instances.push(instance);
                    $qw.emitSync(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, descriptor.name), descriptor, instance);
                    this.log.debug(`New instance of bean ${descriptor.name}`)
                }
                return descriptor.instances.at(0);
            default:
                throw new Error(`Not implemented bean scope: ${descriptor.scope}`)
        }
    }

    /**
     * Register a bean from its descriptor,
     * this class DOESN'T initialize it!
     *
     * @param descriptor
     */
    addBean(descriptor: BeanDescriptor) {
        assert(descriptor);
        assert(this.beans);
        assert(descriptor.clazz);
        assert(descriptor.name);
        [
            // "class:" + descriptor.clazz.name, // common to different beans ?,
            ...descriptor.groups,
            descriptor.name, // should be unique
        ].forEach(
            (key: string) => {
                if (!this.beans.has(key)) {
                    this.beans.set(key, new Heap<BeanDescriptor>(Heap.Comparators.priority))
                }
                this.beans.get(key).push(descriptor)
                $qw.emitSync(Strings.format(EventNames.BEAN_REGISTERED_NAME, key), descriptor);
            }
        );
        return descriptor;
    }

    // /**
    //  * Register a bean from its instance
    //  *
    //  * @param instance
    //  * @param priority
    //  */
    // registerBeanFromInstance(
    //     instance: object,
    //     priority: number = 0
    // ) {
    //     assert(instance)
    //     let d: BeanDescriptor = {
    //         clazz: instance.constructor,
    //         name: instance.constructor.name.at(0).toLowerCase() + instance.constructor.name.slice(1),
    //         priority: priority,
    //         scope: BeanScope.SINGLETON,
    //         lazy: false,
    //         instances: [instance]
    //     }
    //     return this.registerBeanFromDescriptor(d);
    // }

    // /**
    //  * Register a bean from a class, note it doesn't initialize it
    //  *
    //  * @param clazz
    //  * @param scope
    //  * @param priority
    //  */
    // registerBeanFromClass<T>(
    //     clazz: new () => T,
    //     scope: BeanScope = BeanScope.SINGLETON,
    //     // lazy: boolean = false,
    //     priority: number = 0
    // ) {
    //     assert(clazz);
    //     let d: BeanDescriptor = {
    //         clazz: clazz,
    //         name: clazz.name.at(0).toLowerCase() + clazz.name.slice(1),
    //         priority: priority,
    //         scope: scope,
    //         instances: new Array<any>()
    //     }
    //     // if (!lazy && scope === BeanScope.SINGLETON) {
    //     //     d.instances.push(this.autoconstruct(clazz))
    //     // }
    //     return this.registerBeanFromDescriptor(d);
    // }

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
    private loadBeansFromPaths(searchPaths: Array<string>): BeanDescriptor[] {
        assert(searchPaths)
        searchPaths = searchPaths.map(x => {
            if (x.startsWith("/")) {
                return x
            }
            return path.join(__dirname, "..", "..", x);
        });

        let beans: Array<BeanDescriptor> =
            glob.globSync(searchPaths, {})
                .map(p => {
                    if (!path.isAbsolute(p)) {
                        return path.resolve(p);
                    }
                    return p;
                })
                .filter(p => fs.statSync(p).isFile())
                .map(p => this.loadContentFromPath(p))
                .flatMap(c => Object.entries(c))
                .filter((e: [string, any]) => "__bean__" in e[1])
                .map((e: [string, any]): BeanDescriptor => {
                    return {
                        name: e[0],
                        clazz: e[1],
                        scope: e[1].__bean__.scope ?? BeanScope.SINGLETON,
                        dependsOn: e[1].__bean__.dependsOn ?? []
                    }
                });

        // FIXME force relationship between groups and single beans, groups depends on all items of the group
        // FIXME define groups
        let beansInLoadOrder = sortDependenciesByLoadOrder(
            beans,
            {
                getVertexName(e: BeanDescriptor): string {
                    return e.name;
                },
                getChildrenNames(e: BeanDescriptor): Array<string> {
                    return e.dependsOn ?? []
                }
            }
        );

        this.log.debug(`Beans: ${beansInLoadOrder.map(x => x.name)}`);

        beansInLoadOrder
            .filter(e => e.scope === BeanScope.SINGLETON)
            .forEach(e => {
                this.addBean(e);
                this.requireFromDescriptor(e);
            })

        return beansInLoadOrder;
    }

    /**
     * construct a class instance, autoresolve all constructor arguments from other beans
     *
     * @param clazz
     */
    autoconstruct<T>(clazz: new () => T) {
        assert(clazz);
        // FIXME autowire arguments, find bean descriptor for clazz ?
        // FIXME assume the construtor has parameters or the class define some parameters? mmmm
        var args: [] = []
        var instance: any = new clazz(...args);
        // var instance = Object.create(clazz.prototype);
        // instance.constructor.apply(instance, args);

        // find autowired fields and resolve them
        Object.entries(instance)
            .filter((e: [string, any]) => e[1] instanceof AutowiredField)
            .forEach((e: [string, AutowiredField<any>]) => {
                instance[e[0]] = e[1].resolve();
            })

        // call postConstruct if defined
        if ("postConstruct" in instance) {
            instance.postConstruct();
        }

        return instance;
    }

    // autowire(func: Function) {
    //     var args: any[] = []
    //     var func
    // instance.apply(instance, args);
    // }

}