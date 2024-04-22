// import {__Bean__} from "@qwiki/core/beans/__Bean__";
// import {BeanPriority} from "@qwiki/core/beans/BeanUtils";
// import {Autowire} from "@qwiki/core/beans/Autowire";
// import {Base} from "@qwiki/core/base/Base";
// import {Converter} from "@qwiki/modules/conversion/Converter";
// import {ConversionService} from "@qwiki/modules/conversion/ConversionService";
//
// export class Common {
//
// }
//
// export class Foo extends Common {
//     static __bean__: __Bean__ = {
//         priority: BeanPriority.LOW,
//     };
//     foo = "Hello";
// }
//
// export class Bar extends Common {
//     static __bean__: __Bean__ = {
//         priority: BeanPriority.HIGH,
//     };
//     bar = "Bob";
// }
//
// export class Baz extends Base {
//     static __bean__ = {}
//
//     info = Autowire(Common)
//     conversionService = Autowire(ConversionService)
//
//     postConstruct() {
//         let foo = this.conversionService.convert(this.info, Foo)
//         this.log.info(`Baz: ${foo.foo}`) // should returns Bar
//     }
// }
//
// export class BarToFooConverter extends Converter {
//     from = Bar.name // FIXME use classes here or generic names are ok ?
//     to = Foo.name
//
//     convert<Bar, Foo>(source: Bar): Foo {
//         let result = new Foo();
//         result.foo = source.bar;
//         return result;
//     }
// }
