import {BeanScope} from "./BeanScope";

export interface BeanDescriptor {
    name: string;
    clazz: any;
    groups?: Array<string>;
    priority?: number;
    scope: BeanScope;
    lazy?: boolean;
    instances?: Array<any>;
    dependsOn?: Array<string>;
}

