import {BeanScope} from "./BeanScope";

export interface BeanDescriptor {
    name: string;
    clazz: any;
    priority?: number;
    scope: BeanScope;
    lazy?: boolean;
    instances: Array<any>;
}

