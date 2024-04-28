import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {EventNames} from "@qwiki/core/events/EventNames";
import {EventContext} from "@qwiki/core/events/EventManager";
import {Server} from "@qwiki/modules/server/Server";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";
import {Value} from "@qwiki/core/beans/Value";
import {Objects} from "@qwiki/core/utils/Objects";
import {ServerFactory} from "@qwiki/modules/server/ServerFactory";

export class ServerConfig extends Base {
    static __bean__: __Bean__ = {}

    servers: Server[] = Autowire([Server], true);
    serverFactories: Map<string, ServerFactory> = Autowire([ServerFactory], (x: ServerFactory) => x.constructor.name, true);
    configServers: {} = Value("qwiki.servers")

    async postConstruct() {
        let self = this;
        $qw.on(EventNames.STARTUP, async (ctx: EventContext) => {
            await self.start()
        })
        $qw.on(EventNames.STOP, async (ctx: EventContext) => {
            await self.stop()
        });
        for (let [serverName, serverConfig] of Object.entries(this.configServers) as [string, any]) {
            if (!serverConfig.kind) {
                throw new Error(`Missing kind field in qwiki.servers.${serverName} config`);
            }
            let factoryName = serverConfig.kind + "ServerFactory";
            if (!this.serverFactories.has(factoryName)) {
                this.log.error(`Cannot initializing server '${serverName}', factory bean not found: ${factoryName}`);
                continue
            }
            let factory = this.serverFactories.get(factoryName);
            let bean = factory.newBean(serverName, serverConfig);
            await $qw._moduleManager.addBean(bean, true);
            this.servers.push(await bean.getInstance());
        }
    }

    async start() {
        this.log.debug(`Start servers`)
        let promises = []
        for (let server of this.servers) {
            promises.push(server.start());
        }
        // $qw._childPromises.push(...promises);
        return Promise.all(promises);
    }

    async stop() {
        for (let server of this.servers) {
            server.stop();
        }
    }

}