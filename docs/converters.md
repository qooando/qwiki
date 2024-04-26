# Converters

A core module exposes a bean `ConversionService` you can
use to autoregister `Converter<From, To>` beans and use
them.

```ts
import {ConversionService} from "./ConversionService";

export class Foo {
    foo: string
}

export class Bar {
    bar: string
}

export class Service {
    conversionService = Autowire(ConversionService);

    foo(a: Foo) {
        return this.conversionService.convet(a, Bar);
    }
}
```

to define a converter, create a bean from class `Converter`

```ts
export class FooToBarConverter extends Converter<Foo, Bar> {
    static __bean__ = {}

    from = Foo;
    to = Bar;

    convert(a: Foo): Bar {
        return new Bar(a.foo);
    }

}
```

or use the converter factory function

```ts
export let FooToBarConverter = 
    converterFactory(
        Foo, 
        Bar, 
        a => new Bar(a.foo))
```

