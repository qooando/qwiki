import {ExpressRoute} from "@qwiki/modules/express/ExpressRoute";
import {Autowire} from "@qwiki/core/beans/Autowire";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import * as assert from "node:assert";
import {OpenApiMiddleware} from "@qwiki/modules/express/middleware/OpenApiMiddleware";
import {Value} from "@qwiki/core/beans/Value";
import {Express} from "express";
import * as express from "express";
import * as fs from "node:fs";
import {WikiService} from "@qwiki/modules/wiki/WikiService";

// var express = require('express')

export class WikiRoutes extends ExpressRoute {
    static __bean__: __Bean__ = {}

    server = Value("qwiki.wiki.server", "wiki", false);
    staticFilesLocalPath = Value("qwiki.wiki.staticFiles.localPath", "./static", false);

    urlPrefix = "/";
    openapi = Autowire(OpenApiMiddleware);

    wikiService = Autowire(WikiService);

    async postConstruct() {
        this.staticFilesLocalPath = fs.realpathSync(this.staticFilesLocalPath)
    }

    applyRoutes(app: Express) {
        assert(app);

        this.log.debug(`Serve static files at ${this.urlPrefix} from ${this.staticFilesLocalPath}`)

        // FIXME test if they work and openapi

        app.get("/api/documents/:documentId",
            this.openapi.middleware.path({
                responses: {
                    200: {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {type: 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            (request, response) => {
                let internalUrl = new URL(`json-file:/${request.params.documentId}`);
                return response.json(this.wikiService.readDocumentByUrl(internalUrl));
            }
        )

        app.put("/api/documents/:documentId",
            this.openapi.middleware.path({
                responses: {
                    200: {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {type: 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            (request, response) => {
                let internalUrl = new URL(`json-file:/${request.params.documentId}`);
                let content = request.body;
                return response.json(this.wikiService.writeDocumentByUrl(internalUrl, content));
            }
        )

        app.use(this.urlPrefix, express.static(this.staticFilesLocalPath));
    }

}