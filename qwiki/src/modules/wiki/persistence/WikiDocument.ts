import {ObjectId} from "mongodb";
import {__ENTITY__, Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";

export class WikiDocument extends Entity {
    static __entity__: __ENTITY__ = {
        collection: "wiki.document",
    };

    parentWikiId: any;
    title: string;
    annotations: Map<string, string> = new Map();
    tags: string[] = [];

    mediaType: string; // MIME type
    content: any;
    ast: any;
}