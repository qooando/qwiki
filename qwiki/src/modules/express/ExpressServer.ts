import {Server} from "@qwiki/modules/server/Server";
import * as http from "node:http";
import {Express} from "express";
import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {require} from "@qwiki/core/utils/common";
import {Autowire} from "@qwiki/core/beans/Autowire";

const express = require("express");

export class ExpressServer extends Server {

    declare name: string;

    host: string = "localhost";
    port: number = 8080;
    _express: Express;
    _server: http.Server;

    routes = Autowire(
        [ExpressRoute],
        (x) => x.servers.includes(this.name) || x.servers.includes("*")
    );

    async postConstruct() {
        this._express = express();

        for (let route of this.routes) {
            route.register(this._express);
        }

        let self = this;

        // @ts-ignore
        this._express.use((err, req, res, next) => {
            self.log.error(err.stack);
            res.status(500).send('Something broke!')
        })

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