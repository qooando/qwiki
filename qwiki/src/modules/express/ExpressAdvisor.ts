import {Base} from "@qwiki/core/base/Base";
import {Express} from "express";
import {Reflection} from "@qwiki/core/utils/Reflection";

export class ExpressAdvisor extends Base {

    declare servers: string[];

    register(app: Express) {
        for (let [member, method] of Reflection.getMethods(this)) {
            if (!member.startsWith("advisor")) {
                continue;
            }
            app.use(method);
        }
        // app.use((err, req, res, next) => value(err, req, res, next));
    }
}