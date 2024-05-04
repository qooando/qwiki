import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Express} from "express";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";
import {assert, require} from "@qwiki/core/utils/common";

export class SwaggerRoutes extends ExpressRoute {
    static __bean__: __Bean__ = {}

    servers = [
        "*"
    ]

    openapi = Autowire(OpenApiMiddleware);

    register(app: Express) {
        assert(app);

        // https://github.com/wesleytodd/express-openapi
        app.use(this.openapi.middleware)
        app.use('/api-docs', this.openapi.middleware.swaggerui())
    }
}