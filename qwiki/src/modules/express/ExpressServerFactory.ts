import {ServerFactory} from "@qwiki/modules/server/ServerFactory";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Bean} from "@qwiki/core/beans/Bean";
import {Strings} from "@qwiki/core/utils/Strings";
import {ExpressServer} from "@qwiki/modules/express/ExpressServer";
import * as assert from "node:assert";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";
import {ActuatorsRoutes} from "@qwiki/modules/express/routes/ActuatorsRoutes";
import {ExpressConfig} from "@qwiki/modules/express/ExpressConfig";

export class ExpressServerFactory extends ServerFactory {
    static __bean__: __Bean__ = {
        dependsOn: [
            ExpressConfig.name,
        ]
    }

    newBean(name: string, config: any): Bean {
        assert(name);
        assert(config);
        let beanName = Strings.capitalize(name) + "ExpressServer";
        let host: string = config.host ?? "localhost";
        let port: number = config.number ?? 8080;

        class ExpressServerTemplate extends ExpressServer {
            static __bean__: __Bean__ = {
                name: beanName
            }
            host = host;
            port = port;
        }

        let bean = new Bean(ExpressServerTemplate);
        return bean;
    }

}