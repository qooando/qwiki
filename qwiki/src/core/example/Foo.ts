import {__Bean__} from "../beans/__Bean__";
import {JavascriptLoader} from "../loaders/JavascriptLoader";
import {Base} from "../base/Base";
import {Autowire} from "../beans/Autowire";

export class Foo extends Base {
    static __bean__: __Bean__ = {}
    //
    // loader = Autowire(JavascriptLoader);
    // loaders = Autowire([JavascriptLoader]);
    bar = Autowire(Bar);

    constructor() {
        super();
    }

    postConstruct() {
        this.log.debug(`New Foo`)
    }

}

export class Bar extends Base {
    static __bean__ = {}

    foo = Autowire(Foo);

    constructor() {
        super();
    }

    postConstruct() {
        this.log.debug(`New Bar`)
    }
}