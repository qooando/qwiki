import {BeanConstants, BeanScope} from "./BeanConstants";
import {AutowiredField, getAutowiredFields} from "./Autowire";
import * as assert from "assert";
import {Strings} from "../utils/Strings";
import {EventNames} from "../events/EventNames";

export class Bean {
    name: string;
    clazz: any;
    groups: Array<string>;
    priority: number;
    scope: BeanScope;
    lazy: boolean;
    instances: Array<any>;
    dependsOn: Array<string>;
    path: string;

    constructor(
        clazz: any,
        name: string = undefined,
        groups: string[] = undefined,
        scope: BeanScope = BeanScope.SINGLETON,
        priority: number = undefined,
        dependsOn: string[] = undefined,
        path: string = undefined
    ) {
        assert(clazz);
        const BEAN_FIELD_NAME = BeanConstants.BEAN_FIELD_NAME;
        const beanConfig = clazz[BEAN_FIELD_NAME] ??= {};

        this.clazz = clazz;
        this.name = name ?? beanConfig.name ?? clazz.name;
        this.groups = groups ?? beanConfig.groups ?? [];
        this.scope = scope ?? beanConfig.scope ?? BeanScope.SINGLETON;
        this.priority = priority ?? beanConfig.priority ?? 0;
        this.dependsOn = dependsOn ?? beanConfig.dependsOn ?? [];
        this.instances = []
        this.path = path;

        // search autowired fields in clazz and add bean names as dependencies
        this.dependsOn.push(...
            getAutowiredFields(new clazz())
                .map(x => x[1].beanName)
        )
    }

    getInstance() {
        if (this.scope === BeanScope.SINGLETON &&
            this.instances.length >= 1) {
            return this.instances[0];
        }

        // assumes constructor is always with no arguments
        let defaultConstructorArguments: [] = []
        let instance: any = new this.clazz(...defaultConstructorArguments);

        // find autowired fields and resolve them
        getAutowiredFields(instance)
            .forEach((x: [string, AutowiredField<any>]) => {
                instance[x[0]] = x[1].resolve();
            })

        // call postConstruct if defined
        if ("postConstruct" in instance) {
            instance.postConstruct();
        }

        $qw.emitSync(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, this.name), this, instance);

        this.instances.push(instance);
        return instance;
    }


}