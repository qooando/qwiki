import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire, AutowireFactory} from "@qwiki/core/beans/Autowire";
import {Repository} from "@qwiki/modules/persistence/models/Repository";
import {ServerFactory} from "@qwiki/modules/server/ServerFactory";
import {Value} from "@qwiki/core/beans/Value";
import {Bean} from "@qwiki/core/beans/Bean";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import {RepositoryQuery} from "@qwiki/modules/persistence/query/RepositoryQuery";
import {query} from "express";


export class PersistenceService extends Base {
    static __bean__: __Bean__ = {}

    availableRepositories = AutowireFactory(
        [Repository],
        null,
        (x) => x.name
    )

    persistenceConfig: any = Value("qwiki.persistence", "FileServer")

    defaultPersistence: Repository;

    async postConstruct() {
        // this.log.debug(`Repository beans: ${[...this.availableRepositories.keys()].join(", ")}`);

        let beanName = this.persistenceConfig.bean
        this.log.debug(`Default repository: ${beanName}`)

        if (!this.availableRepositories.has(beanName)) {
            throw new NotImplementedException(`No repository bean found: ${beanName}. Valid values are: ${[...this.availableRepositories.keys()].join(", ")}`)
        }

        this.defaultPersistence = await this.availableRepositories.get(beanName).getInstance();
    }

    getPersistence() {
        return this.defaultPersistence;
    }

}