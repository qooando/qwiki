import {BeanScope} from "./BeanScope";

export interface __Bean__ {
    name?: string;
    priority?: number;
    scope?: BeanScope;
    lazy?: boolean;
    dependsOn?: Array<string>
}

