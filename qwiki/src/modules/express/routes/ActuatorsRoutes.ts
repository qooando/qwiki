import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Express} from "express";
import actuator = require("express-actuator");
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as assert from "node:assert";
import {ExpressConfig} from "@qwiki/modules/express/ExpressConfig";

export class ActuatorsRoutes extends ExpressRoute {
    static __bean__: __Bean__ = {}

    server = ExpressConfig.FOR_ANY_SERVER_NAME;

    applyRoutes(app: Express) {
        assert(app);

        // ACTUATORS endpoints
        const options = {
            // basePath: '/management', // It will set /management/info instead of /info
            // infoGitMode: 'simple', // the amount of git information you want to expose, 'simple' or 'full',
            // infoBuildOptions: null, // extra information you want to expose in the build object. Requires an object.
            // infoDateFormat: null, // by default, git.commit.time will show as is defined in git.properties. If infoDateFormat is defined, moment will format git.commit.time. See https://momentjs.com/docs/#/displaying/format/.
            // customEndpoints: [] // array of custom endpoints
        };
        app.use(actuator(options))
    }
}