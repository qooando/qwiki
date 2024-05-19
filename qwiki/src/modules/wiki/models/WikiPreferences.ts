import {ObjectId} from "mongodb";
import {__ENTITY__, Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";

export class WikiPreferences implements Entity {
    static __entity__: __ENTITY__ = {
        collection: "wiki.preferences",
        typeAlias: "WikiPreferences",
    };

    foo: string
    //
    // constructor(
    //     public foo: string,
    //     public id?: ObjectId
    // ) {
    // }
}