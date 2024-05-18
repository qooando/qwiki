import {__Bean__} from "../../../src/core/beans/__Bean__";
import {Repository, AbstractRepositoryFactory} from "./models/Repository";
import {RepositoryQuery} from "./query/RepositoryQuery";
import {NotImplementedException} from "../../../src/core/utils/Exceptions";
import {Bean} from "../../../src/core/beans/Bean";
import {BeanScope} from "../../../src/core/beans/BeanUtils";
import {Value} from "../../../src/core/beans/Value";

export class FileRepository extends Repository {
    static __bean__: __Bean__ = {
        scope: BeanScope.PROTOTYPE
    };

    basePath: string = Value("qwiki.persistence.config.basePath", "./repository");

    constructor() {
        super();
    }

    async postConstruct() {
        this.log.debug(`${this.constructor.name}: ${this.basePath}`);
    }

    async find(query: RepositoryQuery): Promise<any[]> {
        throw new NotImplementedException();
    }

    async findAll(): Promise<any[]> {
        throw new NotImplementedException();
    }

    async findById(id: string): Promise<any> {
        throw new NotImplementedException();
    }

    async save(model: any): Promise<any> {
        throw new NotImplementedException();
    }

}
