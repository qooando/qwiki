import {ExpressController} from "@qwiki/modules/express/ExpressController";
import {Express} from "express";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";
import {assert, require} from "@qwiki/core/utils/common";
import {BeanPriority} from "@qwiki/core/beans/BeanUtils";

export class SwaggerController extends ExpressController {
    static __bean__: __Bean__ = {
        priority: BeanPriority.MIN_PRIORITY
    }

    servers = [
        "*"
    ]

    openapi = Autowire(OpenApiMiddleware);

    register(app: Express) {
        assert(app);

        // https://github.com/wesleytodd/express-openapi
        app.use(this.openapi.middleware)
        app.use('/swagger', this.openapi.middleware.swaggerui())
    }
}