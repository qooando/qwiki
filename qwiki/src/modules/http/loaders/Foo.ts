import {Base} from "@qwiki/core/base/Base";
import {Autowire, AutowireList} from "@qwiki/core/beans/Autowire";
import {Loader} from "@qwiki/core/loaders/Loader";

export class Foo extends Base {
    static __bean__ = {}

    loaders: Loader[] = Autowire([Loader])

    postConstruct() {
        // this.log.info(`Loaders: ${this.loaders.map(x => x.constructor.name)}`)
    }
}