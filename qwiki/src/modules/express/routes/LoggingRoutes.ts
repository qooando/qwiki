import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Express} from "express";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {ExpressConfig} from "@qwiki/modules/express/ExpressConfig";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";
import {assert, require} from "@qwiki/core/utils/common";

export class LoggingRoutes extends ExpressRoute {
    static __bean__: __Bean__ = {}

    server = ExpressConfig.FOR_ANY_SERVER_NAME;

    // openapi = Autowire(OpenApiMiddleware);

    applyRoutes(app: Express) {
        assert(app);

        // var audit = require('express-requests-logger')

        app.use((req, res, next) => {
            this.log.debug(`${new Date().toISOString()}: ${req.method.padStart(7)} ${req.path}`);
            next()
        });

        // app.use(audit({
        //     logger: this.log, // Existing bunyan logger
        //     // excludeURLs: [‘health’, ‘metrics’], // Exclude paths which enclude 'health' & 'metrics'
        //     request: {
        //     //     maskBody: [‘password’], // Mask 'password' field in incoming requests
        //         excludeHeaders: ["authorization"], // Exclude 'authorization' header from requests
        //     //     excludeBody: [‘creditCard’], // Exclude 'creditCard' field from requests body
        //     //     maskHeaders: [‘header1’], // Mask 'header1' header in incoming requests
        //         maxBodyLength: 50 // limit length to 50 chars + '...'
        //     },
        //     response: {
        //     //     maskBody: [‘session_token’] // Mask 'session_token' field in response body
        //     //     excludeHeaders: [‘*’], // Exclude all headers from responses,
        //     //     excludeBody: [‘*’], // Exclude all body from responses
        //     //     maskHeaders: [‘header1’], // Mask 'header1' header in incoming requests
        //     //     maxBodyLength: 50 // limit length to 50 chars + '...'
        //     }
        //     // shouldSkipAuditFunc: function(req, res){
        //     //     // Custom logic here.. i.e: return res.statusCode === 200
        //     //     return false;
        //     // }
        // }))
    }

}