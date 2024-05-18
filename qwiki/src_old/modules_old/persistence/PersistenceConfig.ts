import {Base} from "../../../src/core/base/Base";
import {__Bean__} from "../../../src/core/beans/__Bean__";
import {AutowireFactory} from "../../../src/core/beans/Autowire";
import {Repository} from "./models/Repository";
import {Value} from "../../../src/core/beans/Value";
import {NotImplementedException} from "../../../src/core/utils/Exceptions";


export class PersistenceConfig extends Base {
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

        let kind = this.persistenceConfig.kind;
        let candidateNames = [
            kind,
            kind + "Persistence",
            kind + "Repository"
        ].filter(x => this.availableRepositories.has(x));
        if (!candidateNames.length) {
            throw new NotImplementedException(`No repository bean found: ${kind}. Valid values are: ${[...this.availableRepositories.keys()].join(", ")}`)
        }
        let factoryName = candidateNames[0];
        this.log.debug(`Default repository: ${factoryName}`)
        this.defaultPersistence = await this.availableRepositories.get(factoryName).getInstance();
    }

    getPersistence() {
        return this.defaultPersistence;
    }

}