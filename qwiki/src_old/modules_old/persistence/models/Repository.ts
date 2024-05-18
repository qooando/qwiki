import * as uuid from "uuid";
import {RepositoryQuery} from "../query/RepositoryQuery";
import {NotImplementedException} from "../../../../src/core/utils/Exceptions";
import {Base} from "../../../../src/core/base/Base";

export class Repository extends Base {

    generateId(): string {
        return uuid.v4();
    }

    findById(id: string): Promise<any> {
        throw new NotImplementedException();
    }

    findAll(): Promise<any[]> {
        throw new NotImplementedException();
    }

    find(query: RepositoryQuery): Promise<any[]> {
        throw new NotImplementedException();
    }

    save(model: any): Promise<any> {
        throw new NotImplementedException();
    }
}

export abstract class AbstractRepositoryFactory {

}