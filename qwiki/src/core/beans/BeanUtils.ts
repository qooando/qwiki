import {Strings} from "@qwiki/core/utils/Strings";
import {Bean} from "@qwiki/core/beans/Bean";
import {__Bean__} from "@qwiki/core/beans/__Bean__";

export class BeanConstants {
    static BEAN_FIELD_NAME: string = "__bean__";
    static BEAN_CLASS_IDENTIFIER: string = "class:{}"
    static BEAN_GROUP_IDENTIFIER: string = "group:{}"
}

export enum BeanScope {
    SINGLETON = "SINGLETON",
    PROTOTYPE = "PROTOTYPE"
}

export enum BeanPriority {
    BOTTOM = Number.MAX_SAFE_INTEGER,
    LOWEST = 10000,
    LOWER = 1000,
    LOW = 100,
    DEFAULT = 0,
    HIGH = -100,
    HIGHER = -1000,
    HIGHEST = -10000,
    TOP = Number.MIN_SAFE_INTEGER,
}

export class BeanUtils {

    static getBeanIdentifierFromClass(clazz: any) {
        return Strings.format(BeanConstants.BEAN_CLASS_IDENTIFIER, clazz.name)
    }

    static getBeanIdentifierFromGroup(group: string) {
        return Strings.format(BeanConstants.BEAN_GROUP_IDENTIFIER, group)
    }

    static compareName(a: Bean, b: Bean): number {
        return a.name === b.name ? 0 : (a.name < b.name ? -1 : 1)
    }

    static defineComponent(obj: any, __bean__: __Bean__ = {}) {
        obj.__bean__ = __bean__;
        return obj;
    }

}