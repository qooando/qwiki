# Beans

Define a bean:

```typescript
import {__Bean__} from "./__Bean__";

export class MyBean {
    static __bean__: __Bean__ = {}
}

```

Define its constructor or any other function for autoconstruct/autowire

```typescript
import {__Bean__} from "./__Bean__";

export class MyBean {
    static __bean__: __Bean__ = {}

    construct(arg1, arg2) {

    }

    MyBean.constructor.args = ["myFoo", "myBar"];
    
}
```