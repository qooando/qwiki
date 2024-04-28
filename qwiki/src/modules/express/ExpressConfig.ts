import {Base} from "@qwiki/core/base/Base";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Strings} from "@qwiki/core/utils/Strings";
import {ExpressServer} from "@qwiki/modules/express/ExpressServer";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";
import {Bean} from "@qwiki/core/beans/Bean";
import {Actuators} from "@qwiki/modules/express/routes/Actuators";
import {BeanUtils} from "@qwiki/core/beans/BeanUtils";

export class ExpressConfig extends Base {
    static __bean__: __Bean__ = {}
    static FOR_ANY_SERVER_NAME = "__DEFAULT__";

    routes = Autowire([ExpressRoute], true);
    routesByServerName = new Map<string, ExpressRoute[]>;

    async postConstruct() {
        for (var route of this.routes) {
            let serverNames = [
                route.server,
                Strings.capitalize(route.server) + ExpressServer.name
            ];
            for (let serverName of serverNames) {
                if (!this.routesByServerName.has(serverName)) {
                    this.routesByServerName.set(serverName, [])
                }
                this.routesByServerName.get(serverName).push(route);
            }
        }

        let self = this;

        // auto-add routes on new ExpressServer by name
        $qw.on(Strings.format(EventNames.BEAN_NEW_INSTANCE_NAME, BeanUtils.getBeanIdentifierFromClass(ExpressServer)),
            async (ctx: EventContext, b: Bean, inst: ExpressServer) => {
                if (self.routesByServerName.has(ExpressConfig.FOR_ANY_SERVER_NAME)) {
                    for (let route of self.routesByServerName.get(ExpressConfig.FOR_ANY_SERVER_NAME)) {
                        inst.addRoute(route);
                    }
                }
                if (self.routesByServerName.has(b.name)) {
                    for (let route of self.routesByServerName.get(b.name)) {
                        inst.addRoute(route);
                    }
                }
            }
        )
    }

}