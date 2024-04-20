import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {BeanPriority} from "@qwiki/core/beans/BeanUtils";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";

export class Common {

}

export class Foo extends Common {
    static __bean__: __Bean__ = {
        priority: BeanPriority.LOW,
    }
}

export class Bar extends Common {
    static __bean__: __Bean__ = {
        priority: BeanPriority.HIGH,
    }
}

export class Baz extends Base {
    static __bean__ = {}

    info = Autowire(Common)

    postConstruct() {
        this.log.info(`Baz: ${this.info.constructor.name}`) // should returns Bar
    }
}