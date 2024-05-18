import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";
import {Objects} from "@qwiki/core/utils/Objects";
import {NoSqlPersistence} from "@qwiki/modules/persistence/NoSqlPersistence";
import {require} from "@qwiki/core/utils/common";
import {Db as MongoDb} from "mongodb";
import {Bean} from "@qwiki/core/beans/Bean";
import {Mongo} from "@qwiki/modules/persistence-mongodb/Mongo";

const tingodb = require("tingodb")()

/**
 * TingoDB nosql embedded db compatible with mongodb
 *
 * see also: https://www.npmjs.com/package/tingodb
 */
export class Tingo extends Mongo {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.tingodb", false)
    }

    dbPath: string = Value("qwiki.persistence.tingodb.dbPath", "./defaultdb.nosql")

    async postConstruct() {
        this.log.debug(`TingoDB at: ${this.dbPath}`)
        this.db = new tingodb.Db(this.dbPath, {});
    }

}