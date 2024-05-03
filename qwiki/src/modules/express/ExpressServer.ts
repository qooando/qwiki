import {Base} from "@qwiki/core/base/Base";
import {Server} from "@qwiki/modules/server/Server";
import * as http from "node:http";
import {Express} from "express";
import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {require} from "@qwiki/core/utils/common";

const express = require("express");

export class ExpressServer extends Server {

    host: string = "localhost";
    port: number = 8080;
    _express: Express;
    _server: http.Server;

    constructor() {
        super();
        this._express = express();
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

    addRoute(route: ExpressRoute) {
        return route.applyRoutes(this._express);
    }
}