import {BeanConstants, BeanScope, BeanUtils} from "./BeanUtils";
import {AutowiredPlaceholder, getAutowiredFields} from "./Autowire";
import * as assert from "assert";
import {Strings} from "../utils/Strings";
import {EventNames} from "../events/EventNames";
import {Objects} from "../utils/Objects";

export class Bean {
    name: string;
    clazz: any;
    groups: Array<string>;
    priority: number;
    scope: BeanScope;
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
                .map(x => x[1].beanIdentifier)
        )
    }

    getAllIdentifiers() {
        return [
            this.name,
            ...this.groups.map(x => BeanUtils.getBeanIdentifierFromGroup(x)),
            BeanUtils.getBeanIdentifierFromClass(this.clazz),
            ...Objects.getParentClasses(this.clazz).map(x => BeanUtils.getBeanIdentifierFromClass(x))
        ]
    }

    async getInstance() {
        if (this.scope === BeanScope.SINGLETON &&
            this.instances.length >= 1) {
            return this.instances[0];
        }

        console.log(`New instance ${this.name} from ${this.path}`)
        // assumes constructor is always with no arguments
        let defaultConstructorArguments: [] = []
        let instance: any = new this.clazz(...defaultConstructorArguments);

        // find autowired fields and resolve them
        await Promise.all(
            getAutowiredFields(instance)
                .map(async (x: [string, AutowiredPlaceholder<any>]) => {
                    instance[x[0]] = await x[1].resolve();
                })
        );

        // call postConstruct if defined
        if ("postConstruct" in instance) {
            instance.postConstruct();
        }

        await Promise.all(
            this.getAllIdentifiers()
                .map(async identifier =>
                    await $qw.emit(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, identifier), this, instance)
                ));

        this.instances.push(instance);
        return instance;
    }


}