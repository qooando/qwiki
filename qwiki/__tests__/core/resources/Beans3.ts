export class Car {
    static __bean__ = {}
    model: string = "Generic"

    async postConstruct() {
        this.model = "Panda";
    }
}
