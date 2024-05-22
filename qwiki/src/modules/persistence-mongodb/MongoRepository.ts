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

    _setDefaultField(model: Entity) {
        model._id ??= uuid.v4();
        model._type ??= model.__entity__.typeAlias ?? model.constructor.name
        model.createdAt ??= new Date();
        model.updatedAt = new Date();
        return model;
    }


    async save(model: Entity, collection: string = undefined) {
        collection ??= model.__entity__.collection;
        model = this._setDefaultField(model);
        let coll = this.db.collection(collection);
        await coll.updateOne({_id: model._id}, {$set: model}, {upsert: true});
        let result = coll.findOne({_id: model._id});
        // FIXME autocast to model entity?
        return result;
    }

    async findAll<T extends Entity>(klazz: ClassConstructor<T>, collection: string = undefined) {
        return this.find({}, klazz, collection);
    }

    async find<T extends Entity>(query: any, klazz: ClassConstructor<T>, collection: string = undefined): Promise<T[]> {
        collection ??= (klazz as any).__entity__.collection;
        return this.db.collection(collection)
            .find(query)
            .map(x => new klazz(x))
            .toArray();
    }

    async findOne<T extends Entity>(query: any, klazz: ClassConstructor<T>, collection: string = undefined): Promise<T> {
        collection ??= (klazz as any).__entity__.collection;
        return this.db.collection(collection)
            .findOne(query)
            .then(result => new klazz(result))
            .catch(reason => null)
    }

    async upsert<T extends Entity>(query: any, update: any, klazz: ClassConstructor<T>, collection: string = undefined) {
        collection ??= (klazz as any).__entity__.collection;
        // create default object, then upsert
        // model = this._setDefaultField(model);
        // FIXME missing call to this._setDefaultField(model)
        let coll =  this.db.collection(collection);
        return coll
            .updateOne(query, update, {upsert: true})
            .then(result => coll.findOne(query))
            .then(doc => Objects.mapTo(doc, klazz)) //FIXME wrong initialization
            .then(doc => this._setDefaultField(doc))
            .then(doc => this.save(doc))
            .then(doc => Objects.mapTo(doc, klazz))
    }
}