import {ObjectId} from "mongodb";
import {__ENTITY__, Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";

export class WikiProject extends Entity {
    static __entity__: __ENTITY__ = {
        collection: "wiki.project",
    };

    name: string
}