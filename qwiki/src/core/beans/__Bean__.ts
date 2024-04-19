import {BeanScope} from "./BeanConstants";

export interface __Bean__ {
    name?: string;
    groups?: Array<string>;
    priority?: number;
    scope?: BeanScope;
    lazy?: boolean;
    dependsOn?: Array<string>
}

