import {ExpressController} from "../ExpressController";
import {Express} from "express";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {assert, require} from "@qwiki/core/utils/common";
import {OpenApiMiddleware} from "../middleware/OpenApiMiddleware";
import {BeanPriority} from "@qwiki/core/beans/BeanUtils";

export class HealthzController extends ExpressController {
    static __bean__: __Bean__ = {
        priority: BeanPriority.MIN_PRIORITY
    }

    servers = [
        "*"
    ];

    openapi = Autowire(OpenApiMiddleware);

    register(app: Express) {
        assert(app);

        // HEALTH
        // app.get("/healthz", (request, response) => {
        //     response.send("Alive!")
        // })

        app.get('/healthz',
            this.openapi.middleware.path({
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