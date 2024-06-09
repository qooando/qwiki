import {Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";
import {ClassConstructor} from "@qwiki/core/utils/Types";
import * as uuid from "uuid";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Mongo} from "@qwiki/modules/persistence-mongodb/Mongo";
import {Db} from "mongodb";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Objects} from "@qwiki/core/utils/Objects";

export class MongoRepository {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.mongodb", false)
    }

    mongo = Autowire(Mongo);
    db: Db;

    async postConstruct() {
        this.db = this.mongo.db;
    }

    // _setDefaultField(model: Entity) {
    //     model._id ??= uuid.v4();
    //     model._type ??= model.__entity__.typeAlias ?? model.constructor.name
    //     model.createdAt ??= new Date();
    //     model.updatedAt = new Date();
    //     return model;
    // }


    async save(model: Entity, collection: string = undefined) {
        collection ??= model.__entity__.collection;
        model._id ??= uuid.v4();
        model._type ??= model.__entity__.typeAlias ?? model.constructor.name
        model.createdAt ??= new Date();
        model.updatedAt = new Date();
        let coll = this.db.collection(collection);
        await coll.updateOne({_id: model._id}, {$set: model}, {upsert: true});
        let result = coll.findOne({_id: model._id});
        // FIXME autocast to model entity?
        return result;
    }

    async findAll<T extends Entity>(klazz: ClassConstructor<T>, collection: string = undefined) {
        return this.find({}, klazz, collection);
    }

    async find<T extends Entity>(query: any, klazz: ClassConstructor<T>,
                                 collection: string = undefined,
                                 project: object = undefined): Promise<T[]> {
        collection ??= (klazz as any).__entity__.collection;
        let cur = this.db.collection(collection)
            .find(query)
            .map(x => new klazz(x))
        if (project) {
            cur = cur.project(project);
        }
        return cur.toArray();
    }

    async findOne<T extends Entity>(query: any, klazz: ClassConstructor<T>, collection: string = undefined): Promise<T> {
        collection ??= (klazz as any).__entity__.collection;
        return this.db.collection(collection)
            .findOne(query)
            .then(result => result ? new klazz(result) : result)
            .catch(reason => null)
    }

    async upsert<T extends Entity>(query: any, update: any, klazz: ClassConstructor<T>, collection: string = undefined, upsert: boolean = true) {
        collection ??= (klazz as any).__entity__.collection;
        // create default object, then upsert
        update.$setOnInsert ??= {}
        update.$setOnInsert._id ??= uuid.v4();
        update.$setOnInsert._type ??= (klazz as any).__entity__.typeAlias
        update.$setOnInsert.createdAt ??= new Date();
        update.$set ??= {}
        update.$set.updatedAt ??= new Date();
        let coll = this.db.collection(collection);
        let result = await coll.updateOne(query, update, {upsert: upsert});
        let doc = await coll.findOne(query);
        let model = Objects.mapTo(doc, klazz);
        return model;
    }

    async delete<T extends Entity>(query: any, klazz: ClassConstructor<T>, collection: string = undefined) {
        collection ??= (klazz as any).__entity__.collection;
        let coll = this.db.collection(collection);
        return coll.deleteOne(query);
    }
}