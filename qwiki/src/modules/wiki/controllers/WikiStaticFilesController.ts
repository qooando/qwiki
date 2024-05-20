import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {assert, require} from "@qwiki/core/utils/common";
import {Value} from "@qwiki/core/beans/Value";
import {Express} from "express";
import * as express from "express";
import * as fs from "node:fs";
import {WikiService} from "@qwiki/modules/wiki/WikiService";
import {ExpressController} from "@qwiki/modules/server-express/ExpressController";
import {OpenApiMiddleware} from "@qwiki/modules/server-express/middleware/OpenApiMiddleware";

// var express = require('express')

export class WikiStaticFilesController extends ExpressController {
    static __bean__: __Bean__ = {}

    servers: string[];
    urlPrefix: string;
    staticFilesPath: string;
    openapi = Autowire(OpenApiMiddleware);
    wiki = Autowire(WikiService);

    async postConstruct() {
        this.servers = [this.wiki.appConfig.serverName];
        this.urlPrefix = this.wiki.appConfig.urlPrefix ?? "/";
        this.staticFilesPath = fs.realpathSync(this.wiki.appConfig.staticFilesPath ?? "./data")
    }

    register(app: Express) {
        assert(app);
        this.log.debug(`Serve static files at ${this.urlPrefix} from ${this.staticFilesPath}`)
        app.use(this.urlPrefix, express.static(this.staticFilesPath));
    }

}