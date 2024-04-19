import {__Bean__} from "../beans/__Bean__";
import {JavascriptLoader} from "../loaders/JavascriptLoader";
import {Base} from "../base/Base";
import {Autowire} from "../beans/Autowire";

export class Foo extends Base {
    static __bean__: __Bean__ = {}

    loader = Autowire(JavascriptLoader);
    loaders = Autowire([JavascriptLoader]);

    constructor() {
        super();
    }

    postConstruct() {
        this.log.debug(`New Foo with loader: ${this.loader.constructor.name}`)
    }

}
