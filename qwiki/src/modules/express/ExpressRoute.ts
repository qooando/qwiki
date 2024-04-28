import {Base} from "@qwiki/core/base/Base";
import {Express} from "express";

export class ExpressRoute extends Base {

    server: string; // server name

    applyRoutes(app: Express) {
        throw new Error(`Not implemented`);
    }

}