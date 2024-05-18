import {NoSqlPersistence} from "@qwiki/modules/persistence/NoSqlPersistence";
import {Db as MongoDb} from "mongodb";
import {Value} from "@qwiki/core/beans/Value";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Objects} from "@qwiki/core/utils/Objects";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";

export class Mongo extends NoSqlPersistence {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.mongodb", false)
    }

    db: Mongo
    dbConnectionString: string = Value("qwiki.persistence.mongodb.connectionString", "not_defined")

    async postConstruct() {
        this.log.debug(`MongoDB at: ${this.dbConnectionString}`)
        // FIXME
        throw new NotImplementedException();
        // this.db =
    }
}