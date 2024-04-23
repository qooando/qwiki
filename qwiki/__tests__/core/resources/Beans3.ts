export class Car {
    static __bean__ = {}
    model: string = "Generic"

    postConstruct() {
        this.model = "Panda";
    }
}
