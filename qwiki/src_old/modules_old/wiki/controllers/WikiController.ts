import {ExpressController} from "@qwiki/modules/express/ExpressController";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {assert, require} from "@qwiki/core/utils/common";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";
import {Value} from "@qwiki/core/beans/Value";
import {Express} from "express";
import * as express from "express";
import * as fs from "node:fs";
import {WikiService} from "@qwiki/modules/wiki/WikiService";
import {PermissiveURL} from "../../persistence/models/PermissiveURL";

// var express = require('express')

export class WikiController extends ExpressController {
    static __bean__: __Bean__ = {}

    servers = Value("qwiki.wiki.servers", ["wiki"], false);
    staticFilesLocalPath = Value("qwiki.wiki.staticFiles.localPath", "./static", false);

    urlPrefix = "/";
    openapi = Autowire(OpenApiMiddleware);

    wikiService = Autowire(WikiService);

    async postConstruct() {
        this.staticFilesLocalPath = fs.realpathSync(this.staticFilesLocalPath)
    }

    register(app: Express) {
        assert(app);

        this.log.debug(`Serve static files at ${this.urlPrefix} from ${this.staticFilesLocalPath}`)

        // FIXME

        //
        // // app.get(/\/api\/wiki\/(\w+)\/(.*)/,
        // app.get("/api/wiki/:wikiName/:wikiPath",
        //     this.openapi.middleware.path({
        //         responses: {
        //             200: {
        //                 description: 'Successful response',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 status: {type: 'string'}
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }),
        //     (request, response, next) => {
        //         let internalUrl = new PermissiveURL(`wiki:/${request.params.wikiName}/${request.params.wikiPath}`);
        //         // let internalUrl = new URL(`wiki:/${request.params[0]}/${request.params[1]}`);
        //         this.wikiService.readDocument(internalUrl)
        //             .then(data => response.json(data))
        //             .catch(err => next(err));
        //     }
        // )
        //
        // app.put("/api/wiki/:wikiName/:documentId",
        //     this.openapi.middleware.path({
        //         responses: {
        //             200: {
        //                 description: 'Successful response',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 status: {type: 'string'}
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }),
        //     (request, response, next) => {
        //         let internalUrl = new PermissiveURL(`wiki:/${request.params.wikiName}/${request.params.documentId}`);
        //         let content = request.body;
        //         this.wikiService.writeDocumentByUrl(internalUrl, content)
        //             .then(data => response.json(data));
        //     }
        // )

        // app.get("/api/templates/:templateName/:componentPath([{}a-zA-Z_\\-.\\\\\/]+)",
        //     this.openapi.middleware.path({
        //         summary: "Get a template file",
        //         parameters: [
        //             {
        //                 in: "path",
        //                 name: "templateName",
        //                 schema: {type: "string"},
        //                 required: true,
        //                 description: "Template name"
        //             },
        //             {
        //                 in: "path",
        //                 name: "componentPath",
        //                 schema: {type: "string"},
        //                 required: true,
        //                 description: "Template component"
        //             }
        //         ],
        //         responses: {
        //             200: {
        //                 description: 'Successful response',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object'
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }),
        //     (request, response, next) => {
        //         let internalUrl = new PermissiveURL(`template://${request.params.templateName}/${request.params.componentPath}`);
        //         this.wikiService.readDocument(internalUrl)
        //             .then(data => response.json(data))
        //             .catch(err => next(err));
        //     }
        // )
        //
        // app.use(this.urlPrefix, express.static(this.staticFilesLocalPath));
    }

}