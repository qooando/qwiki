import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Mongo} from "@qwiki/modules/persistence-mongodb/Mongo";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {WikiApplicationConfig} from "@qwiki/modules/wiki/models/WikiApplicationConfig";
import {Value} from "@qwiki/core/beans/Value";
import {WikiConfig} from "@qwiki/modules/wiki/persistence/models/WikiConfig";

export class WikiService extends Base {
    static __bean__: __Bean__ = {}

    mongo: Mongo = Autowire(Mongo);
    config: WikiApplicationConfig = Value("qwiki.applications.wiki", {
        serverName: "default"
    })

    async postConstruct() {
        this.log.debug(`Wiki server: ${this.config.serverName}`)

        let c = new WikiConfig({
            "foo": 123
        });
        this.mongo.save(c);
        // const collection = await this.mongo.db.collection("config");
        // const result = collection.insertOne(c);
    }

}