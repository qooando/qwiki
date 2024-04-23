# Beans

ModuleManager reads all files in the search path and
automatically load all beans it founds resolving
them in dependencies order.

You can define search paths in the global configuration
```yaml
qwiki:
  modules:
    searchPaths:
      - "./core/**/*.js"
      - "./modules/**/*.js"
```

## Define a bean

Define a bean adding a static `__bean__` field to the class. You can assign the `__Bean__` interface for type checking.
The object contains bean configuration.

```typescript
import {__Bean__} from "./__Bean__";

export class MyBean {
    static __bean__: __Bean__ = {}
}

```

Bean SHOULD have a constructor without arguments.

## Autowire and postConstruct

You can use `Autowire` object to define autocompleting fields. These fields are substitute with the correct value
after object constructor and before postConstruct optional method.

Fields can be single items, lists, and maps, by class and by bean name.

```typescript
import {__Bean__} from "./__Bean__";
import {Autowire} from "./Autowire";
import {Base} from "./Base";

export class Foo {
    static __bean__: __Bean__ = {}
    id: string;
}

export class MyBean extends Base {
    static __bean__: __Bean__ = {}

    singleItem: Foo = Autowire(Foo);
    singleItem2: Foo = Autowire("Foo")
    listOfItems: Foo[] = Autowire([Foo]);
    listOfItems2: Foo[] = Autowire(["Foo"])
    mapOfItems: Map<string, Foo> = Autowire([Foo], (x) => x.id);
    mapOfItems2: Map<string, Foo> = Autowire(["Foo"], (x) => x.id);

    postConstruct() {
        this.log.info(`${this.listOfItems}`)
    }

}
```

## Priority 

If a single item is required but the identifier refers to multiple items, then
only the top item is referred (top item is defined by `priority`);

Priority can be set in the `__bean__` config:

```typescript
import {BeanPriority} from "./BeanUtils";
import {Autowire} from "./Autowire";

class Common {
    
}

class Foo extends Common {
    static __bean__: __Bean__ = {
        priority: BeanPriority.LOW,
    }
}

class Bar extends Common {
    static __bean__: __Bean__ = {
        priority: BeanPriority.HIGH,
    }
}

class Baz {
    static __bean__ = {}

    info = Autowire(Common)
    
    postConstruct() {
        console.log(`${info.constructor.name}`) // should returns Bar    
    }
}
```

## Identifiers

Bean can be reference by different ids:

- bean name (defined in `__bean__.name`), or default is class name
- any field in `__bean__.groups`
- the bean class and parent classes as `class:ClassName` identifiers

e.g.

```typescript
class Foo extends Bar {
    static __bean__: __Bean__ = {
        name: "good",
        groups: ["evening", "morning"]
    }
}
```

can be reference by following identifiers

- `good`
- `group:evening`
- `group:morning`
- `class:Foo`
- `class:Bar`

## Scope

Beans can have different scopes. Default scope is `BeanScope.SINGLETON` saying only one instance of the
bean is created and referenced. You can change scope to `BeanScope.PROTOTYPE`, a new instance is created every time.

```typescript
import {BeanScope} from "./BeanUtils";

class Foo {
    static __bean__ = {
        scope: BeanScope.PROTOTYPE
    }
}
```