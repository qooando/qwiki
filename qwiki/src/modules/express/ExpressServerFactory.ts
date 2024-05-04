import {ServerFactory} from "@qwiki/modules/server/ServerFactory";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Bean} from "@qwiki/core/beans/Bean";
import {Strings} from "@qwiki/core/utils/Strings";
import {ExpressServer} from "@qwiki/modules/express/ExpressServer";
import {assert} from "@qwiki/core/utils/common";
import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";

export class ExpressServerFactory extends ServerFactory {
    static __bean__: __Bean__ = {
        dependsOn: [
            ExpressRoute.name,
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