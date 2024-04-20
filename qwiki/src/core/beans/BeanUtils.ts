import {Strings} from "@qwiki/core/utils/Strings";

export class BeanConstants {
    static BEAN_FIELD_NAME: string = "__bean__";
    static BEAN_CLASS_IDENTIFIER: string = "class:{}"
}

export enum BeanScope {
    SINGLETON = "SINGLETON",
    PROTOTYPE = "PROTOTYPE"
}

export class BeanUtils {

    static getBeanIdentifierFromClass(clazz: any) {
        return Strings.format(BeanConstants.BEAN_CLASS_IDENTIFIER, clazz.name)
    }

}