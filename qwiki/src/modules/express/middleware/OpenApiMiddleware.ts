import {Base} from "@qwiki/core/base/Base";

export class OpenApiMiddleware extends Base {
    static __bean__ = {}

    middleware: any;

    async postConstruct() {
        this.middleware = require('@wesleytodd/openapi')({
            openapi: '3.0.0',
            info: {
                title: 'Qwiki',
                description: 'Generated docs from Qwiki express api',
                version: '1.0.0',
            }
        })
    }
}