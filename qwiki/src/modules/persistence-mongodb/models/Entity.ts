import * as uuid from "uuid";

export interface __ENTITY__ {
    collection: string
    typeAlias?: string
}

export var ENTITY_FIELD: string = "__entity__";

export class Entity {
    _id: any;
    _type: string;
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;

    get __entity__() {
        return (this.constructor as any).__entity__;
    }

    constructor(obj: any = {}) {
        Object.assign(this, obj)
    }

    static of(obj: any = {}) {
        return Object.assign(Object.create(this.prototype), obj)
    }

}
