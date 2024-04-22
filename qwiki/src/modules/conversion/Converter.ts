export interface IConverter {
    from: string
    to: string
    convert: <From, To>(a: From) => To;
    name: () => string;
}

export abstract class Converter implements IConverter {
    abstract convert<From, To>(a: From): To;

    from: string;
    to: string;

    name() {
        return `${this.from}->${this.to}`
    }
}
