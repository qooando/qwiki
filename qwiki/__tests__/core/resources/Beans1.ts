export class Parent {

}

export class Foo extends Parent {
    static __bean__ = {}
}

export class Bar extends Parent {
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
