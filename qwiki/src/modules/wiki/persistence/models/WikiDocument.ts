import {ObjectId} from "mongodb";
import {__ENTITY__, Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";

export class WikiDocument extends Entity {
    static __entity__: __ENTITY__ = {
        collection: "wiki.document",
    };

    constructor(obj: any = {}) {
        super(obj);
    }
    
    project: any;
    title: string;
    annotations: Map<string, string> = new Map();
    tags: string[] = [];
    mediaType: string;
    contentPath: string;
    content: string;

    // content: any;
    // ast: any;
}