import {Server} from "@qwiki/modules/server/Server";
import * as http from "node:http";
import {Express} from "express";
import {ExpressController} from "@qwiki/modules/express/ExpressController";
import {require} from "@qwiki/core/utils/common";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {ExpressAdvisor} from "@qwiki/modules/express/ExpressAdvisor";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {BeanScope} from "@qwiki/core/beans/BeanUtils";

const express = require("express");

export class ExpressServer extends Server {
    static __bean__: __Bean__ = {
        scope: BeanScope.PROTOTYPE
    };

    declare name: string;

    host: string = "localhost";
    port: number = 8080;
    _express: Express;
    _server: http.Server;

    routes = Autowire(
        [ExpressController],
        (x) => x.servers.includes(this.name) || x.servers.includes("*")
    );

    advisors = Autowire(
        [ExpressAdvisor],
        (x) => x.servers.includes(this.name) || x.servers.includes("*")
    );

    constructor(config: any = {}) {
        super(config);
        this.host = config.host ?? "localhost";
        this.port = config.port ?? 8080;
    }

    async postConstruct() {
        this._express = express();

        // logging middleware
        this._express.use((req, res, next) => {
            // this.log.debug(`${new Date().toISOString()}:     ${req.method.padEnd(7)} ${req.path}`);
            let self = this;
            const oldEnd = res.end;
            res.on('finish', function () {
                let code = this.statusCode;
                self.log.debug(`${new Date().toISOString()}: ${code} ${req.method.padEnd(7)} ${req.path}`);
            })
            next()
        });

        for (let route of this.routes) {
            route.register(this._express);
        }

        for (let advisor of this.advisors) {
            advisor.register(this._express);
        }

        // @ts-ignore
        // this._express.use((err, req, res, next) => {
        //     this.log.error(err.stack);
        //     // res.status(500).send('Something broke!')
        //     // next(err)
        // })

        // FIXME add error advisors as beans

    }

    async start(): Promise<void> {
        this._server = this._express.listen(
            this.port,
            this.host,
            () => {
                this.log.info(`Listen on ${this.host}:${this.port}`);
            }
        );
    }

    async stop(): Promise<void> {
        this._server.close();
    }

}