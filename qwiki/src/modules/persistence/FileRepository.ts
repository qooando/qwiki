import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Repository, AbstractRepositoryFactory} from "@qwiki/modules/persistence/models/Repository";
import {RepositoryQuery} from "@qwiki/modules/persistence/query/RepositoryQuery";
import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
import {Bean} from "@qwiki/core/beans/Bean";
import {BeanScope} from "@qwiki/core/beans/BeanUtils";

export class FileRepository extends Repository {
    static __bean__: __Bean__ = {
        scope: BeanScope.PROTOTYPE
    };

    config: any;

    constructor(config: any) {
        super();
        this.config = config;
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
