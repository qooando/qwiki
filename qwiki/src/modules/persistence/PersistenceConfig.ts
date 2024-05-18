import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Base} from "@qwiki/core/base/Base";
import {Value} from "@qwiki/core/beans/Value";

export class PersistenceConfig extends Base {
    static __bean__: __Bean__ = {}

    config: {} = Value("qwiki.persistence")

    async postConstruct() {

    }

}