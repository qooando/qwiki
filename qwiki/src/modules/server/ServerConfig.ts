import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {EventNames} from "@qwiki/core/events/EventNames";
import {Server} from "@qwiki/modules/server/Server";
import {Autowire, AutowireFactory} from "@qwiki/core/beans/Autowire";
import {Base} from "@qwiki/core/base/Base";
import {Value} from "@qwiki/core/beans/Value";
import {Objects} from "@qwiki/core/utils/Objects";
// import {ServerFactory} from "@qwiki/modules/server/ServerFactory";
import {Bean} from "@qwiki/core/beans/Bean";

export class ServerConfig extends Base {
    static __bean__: __Bean__ = {}

    servers: Server[] = []; //Autowire([Server]);

    availableServers: Map<String, Bean> = AutowireFactory(
        [Server],
        undefined,
        (x: Bean) => x.name
    );

    configServers: {} = Value("qwiki.servers")

    async postConstruct() {
        let self = this;
        $qw.on(EventNames.STARTUP, async () => {
            await self.start()
        })
        $qw.on(EventNames.STOP, async () => {
            await self.stop()
        });
        for (let [serverName, serverConfig] of Object.entries(this.configServers) as [string, any]) {
            if (!serverConfig.kind) {
                throw new Error(`Missing kind field in qwiki.servers.${serverName} config`);
            }
            let kind = serverConfig.kind;
            let candidateNames = [
                kind,
                kind + "Server"
            ].filter(x => this.availableServers.has(x))
            if (!candidateNames.length) {
                this.log.error(`Cannot initializing server '${serverName}', bean not found: ${kind}`);
                continue
            }
            let factoryName = candidateNames[0];
            let factory = this.availableServers.get(factoryName);
            serverConfig.name = serverName;
            this.log.debug(`Add server: ${serverName} -> ${factoryName}`)
            this.servers.push(await factory.getInstance(serverConfig));
        }
    }

    async start() {
        // this.log.debug(`Start servers`)
        let promises = []
        for (let server of this.servers) {
            this.log.debug(`Start server: ${server.name}`)
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