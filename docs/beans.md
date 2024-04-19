# Beans

Define a bean:

```typescript
import {__Bean__} from "./__Bean__";

export class MyBean {
    static __bean__: __Bean__ = {}
}

```

Bean SHOULD have a constructor without arguments. Instead you can define Autowire fields that will be resolved
after constructor. Then postConstruct function is called.

```typescript
import {__Bean__} from "./__Bean__";
import {Autowire} from "./Autowire";
import {Base} from "./Base";

export class MyBean extends Base {
    static __bean__: __Bean__ = {}

    foo = Autowire(MyBean2)
    foos = Autowire([MyBean2])
    bar = Autowire("MyBean2")
    bars = Autowire(["MyBean2"])

    postConstruct() {
        // use foo, foos, bar, bars
    }

}
```