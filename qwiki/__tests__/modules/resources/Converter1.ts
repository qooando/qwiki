import {Converter, converterFactory} from "../../../src/modules/conversion/Converter";

export class Foo {
    foo: string

    constructor(foo: string) {
        this.foo = foo;
    }
}

export class Bar {
    bar: string

    constructor(bar: string) {
        this.bar = bar;
    }
}

export let FooToBarConverter = converterFactory(Foo, Bar, a => new Bar(a.foo))

// export class FooToBarConverter extends Converter<Foo, Bar> {
//     static __bean__ = {}
//
//     from = Foo;
//     to = Bar;
//
//     convert(a: Foo): Bar {
//         return new Bar(a.foo);
//     }
//
// }