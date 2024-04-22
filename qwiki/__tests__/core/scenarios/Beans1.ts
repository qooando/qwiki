export class Foo {
    static __bean__ = {}
}

export class Bar {
    static __bean__ = {
        name: "myBar",
    }
}

export class Baz {
    static __bean__ = {
        name: "myBaz",
        groups: ["myGroup"]
    }
}
