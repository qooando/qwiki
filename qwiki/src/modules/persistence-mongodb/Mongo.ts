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

    /**
     * populate default fields in a model, if they are missing
     *
     * @param model
     */
    _setDefaultFields(model: Entity): Entity {
        model._id ??= uuid.v4();
        model._type ??= (model.constructor as any).__entity__.typeAlias
        return model;
    }

    async save(model: Entity) {
        throw new NotImplementedException();
    }

    async find(query: any): Promise<Entity[]> {
        throw new NotImplementedException();
    }

    async findOne(query: any): Promise<Entity> {
        throw new NotImplementedException();
    }

    async upsert(query: any, update: any) {
        throw new NotImplementedException();
    }

}