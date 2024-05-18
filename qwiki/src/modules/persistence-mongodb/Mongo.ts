import {NoSqlPersistence} from "@qwiki/modules/persistence/NoSqlPersistence";
import {Db as MongoDb, MongoClient} from "mongodb";
import {Value} from "@qwiki/core/beans/Value";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Objects} from "@qwiki/core/utils/Objects";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

/**
 * https://www.mongodb.com/resources/products/compatibilities/using-typescript-with-mongodb-tutorial
 */
export class Mongo extends NoSqlPersistence {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.mongodb", false)
    }

    db: MongoDb
    client: MongoClient
    dbName: string = Value("qwiki.persistence.mongodb.connectionString", "default")
    dbConnectionString: string = Value("qwiki.persistence.mongodb.connectionString", "not_defined")

    async postConstruct() {
        this.log.debug(`MongoDB at: ${this.dbConnectionString}`)
        this.client = new MongoClient(this.dbConnectionString);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
    }
}