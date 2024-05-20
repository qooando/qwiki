import {NoSqlPersistence} from "@qwiki/modules/persistence/NoSqlPersistence";
import {Db as MongoDb, MongoClient} from "mongodb";
import {Value} from "@qwiki/core/beans/Value";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Objects} from "@qwiki/core/utils/Objects";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import * as uuid from "uuid";
import {Entity} from "@qwiki/modules/persistence-mongodb/models/Entity";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {DuckTypingScanner} from "@qwiki/modules/scanners/DuckTypingScanner";
import {ClassConstructor} from "@qwiki/core/utils/Types";
import {assert} from "@qwiki/core/utils/common";

/**
 * https://www.mongodb.com/resources/products/compatibilities/using-typescript-with-mongodb-tutorial
 */
export class Mongo extends NoSqlPersistence {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.mongodb", false)
    }

    db: MongoDb
    client: MongoClient
    dbName: string = Value("qwiki.persistence.mongodb.dbName", "default")
    dbUrl: string = Value("qwiki.persistence.mongodb.dbUrl", "not_defined")

    duckScanner = Autowire(DuckTypingScanner);
    byTypeAlias: Map<string, any> = new Map();

    async postConstruct() {
        this.log.debug(`MongoDB at: ${this.dbUrl}`)
        this.client = new MongoClient(this.dbUrl);
        await this.client.connect();
        this.db = this.client.db(this.dbName);

        this.duckScanner.get("__entity__")
            .map(obj => {
                this.byTypeAlias.set(obj.__entity__.typeAlias, obj)
            })
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
        return this.db.collection(collection)
            .updateOne({_id: model._id}, {$set: model}, {upsert: true})
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
        return this.db.collection(collection)
            .updateOne(query, update, {upsert: true})
    }

}