export class Base {
    log: any;

    constructor() {
        this.log = console

        if ((this as any).postConstruct) {
            (this as any).postConstruct()
        }
    }

}
