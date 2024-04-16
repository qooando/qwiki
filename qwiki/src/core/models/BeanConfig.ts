import {BeanScope} from "./BeanScope";

export interface BeanConfig {
    priority?: number;
    scope?: BeanScope;
    lazy?: boolean;
}

