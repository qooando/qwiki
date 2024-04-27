import {Base} from "@qwiki/core/base/Base";
import {Server} from "@qwiki/modules/server/Server";
import * as express from "express";
import * as http from "node:http";

export class ExpressServer extends Server {

    host: string = "localhost";
    port: number = 8080;
    _server: http.Server;

    constructor() {
        super();
    }

    async start(): Promise<void> {
        this._server = express().listen(
            this.port,
            this.host,
            () => {
                this.log.info(`Listen on ${this.host}:${this.port}`);
            }
        );
        // FIXME
        // require('./routers/example')(this._express)
    }

    async stop(): Promise<void> {
        this._server.close();
    }
}