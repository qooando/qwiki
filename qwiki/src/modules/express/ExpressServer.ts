import {Server} from "@qwiki/modules/server/Server";
import * as http from "node:http";
import {Express} from "express";
import {ExpressController} from "@qwiki/modules/express/ExpressController";
import {require} from "@qwiki/core/utils/common";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {ExpressAdvisor} from "@qwiki/modules/express/ExpressAdvisor";

const express = require("express");

export class ExpressServer extends Server {

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

    async postConstruct() {
        this._express = express();

        this._express.use((req, res, next) => {
            this.log.debug(`${new Date().toISOString()}: ${req.method.padStart(7)} ${req.path}`);
            next()
        });

        for (let route of this.routes) {
            route.register(this._express);
        }

        for (let advisor of this.advisors) {
            advisor.register(this._express);
        }

        // @ts-ignore
        this._express.use((err, req, res, next) => {
            this.log.error(err.stack);
            // res.status(500).send('Something broke!')
            // next(err)
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