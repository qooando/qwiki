export class Configuration {
    [key: string]: any

    constructor(content: any = {}) {
        Object.assign(this, content);
    }
}