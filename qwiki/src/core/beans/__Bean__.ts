import {BeanScope} from "./BeanUtils";

export interface __Bean__ {
    name?: string;
    groups?: Array<string>;
    priority?: number;
    scope?: BeanScope;
    dependsOn?: Array<string>;
    loadCondition?: () => boolean;
}

