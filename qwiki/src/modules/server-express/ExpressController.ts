import {Base} from "@qwiki/core/base/Base";
import {Express} from "express";

export class ExpressController extends Base {

    declare servers: string[];

    register(app: Express) {
        throw new Error(`Not implemented`);
    }

}