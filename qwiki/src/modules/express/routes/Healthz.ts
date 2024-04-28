import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Express} from "express";
import actuator = require("express-actuator");
import swaggerUi = require("swagger-ui-express");
import {Value} from "@qwiki/core/beans/Value";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as assert from "node:assert";
import {ExpressConfig} from "@qwiki/modules/express/ExpressConfig";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";

export class Healthz extends ExpressRoute {
    static __bean__: __Bean__ = {}

    server = ExpressConfig.FOR_ANY_SERVER_NAME;

    openapi = Autowire(OpenApiMiddleware);

    applyRoutes(app: Express) {
        assert(app);

        // HEALTH
        // app.get("/healthz", (request, response) => {
        //     response.send("Alive!")
        // })

        app.get('/healthz', this.openapi.middleware.path({
                responses: {
                    200: {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {type: 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            (request, response) => {
                response.json({
                    "status": "ok"
                })
            });
    }

}