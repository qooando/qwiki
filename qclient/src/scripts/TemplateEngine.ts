import {Base} from "./Base.js";
import {ApiClient} from "./ApiClient.js";
import * as Handlebars from "handlebars";
import {replaceOnPromise} from "./snippets/replaceOnPromise.js";
import {strings} from "./handlebars/helpers/strings.js";

export enum HelperNames {
    INCLUDE = "include",
    INCLUDE_STYLE = "include_style",
    INCLUDE_IMAGE = "include_image",
}

export function registerHelper(fun: Handlebars.HelperDelegate) {
    Handlebars.registerHelper(fun.name, fun);
}

export function registerHelpers(...funs: Handlebars.HelperDelegate[]) {
    funs.forEach(registerHelper);
}

export function registerHelpersFromObject(obj: any) {
    Object.entries(obj).forEach(([key, value]) => {
        Handlebars.registerHelper(key, <Handlebars.HelperDelegate>value);
    })
}

export class TemplateEngine extends Base {

    apiClient = new ApiClient();

    postConstruct() {
        const templateEngine = this;

        registerHelpersFromObject(strings);

        // {{ include "test.html" }}
        Handlebars.registerHelper("documents", function () {
            // console.assert(component, `handlebars helper ${HelperNames.INCLUDE}, argument not specified`);
            // return replaceOnPromise(async function (): Promise<any> {
            return templateEngine.apiClient.getDocuments();

            // });
        });

        // {{ include "test.html" }}
        Handlebars.registerHelper(HelperNames.INCLUDE, function (component, ...args: any[]) {
            console.assert(component, `handlebars helper ${HelperNames.INCLUDE}, argument not specified`);
            // NOTE: this is the current context
            const parentCtx = this;
            const ctx = Object.assign({}, parentCtx); // FIXME use args
            // var parentCtx = Object.assign({}, this, ...args);
            return replaceOnPromise(async function (): Promise<string> {
                return await templateEngine.renderTemplateText(parentCtx.template.name, component, ctx);
            });
        });

        // {{ include_style "main.css" }}
        Handlebars.registerHelper(HelperNames.INCLUDE_STYLE, function (component) {
            console.assert(component, `handlebars helper ${HelperNames.INCLUDE_STYLE}, argument not specified`);
            // NOTE: this is the current context
            const parentCtx = this;
            templateEngine.includeTemplateComponentAsStyle(parentCtx.template.name, component);
            return null;
            // return
            // return replaceOnPromise(async function (): Promise<string> {
            //     return await templateEngine.renderTemplateComponent(parentCtx.template.name, component);
            // });
        })

        // {{ include "test.html" }}
        Handlebars.registerHelper(HelperNames.INCLUDE_IMAGE, function (component) {
            console.assert(component, `handlebars helper ${HelperNames.INCLUDE_IMAGE}, argument not specified`);
            // NOTE: this is the current context
            const parentCtx = this;
            return replaceOnPromise(async function (): Promise<string> {
                return await templateEngine.renderImage(parentCtx.template.name, component);
            });
        });

        // // {{ include component="test.html" }}
        // Handlebars.registerHelper(HelperNames.INCLUDE, function (ctx) {
        //     // NOTE: this is the current context
        //     const parentCtx = this;
        //     return replaceOnPromise(async function (): Promise<string> {
        //         return await templateEngine.renderTemplateComponent(parentCtx.template.name, ctx.hash.component);
        //     });
        // })

        // {{> include parent=template.name component="path/to/template/part.html" }}
        // Handlebars.registerPartial(PartialNames.INCLUDE, function (ctx) {
        //     // NOTE: this ISN'T the current context, it is undefined
        //     return replaceOnPromise({
        //         templateEngine: self,
        //         promiseSupplier: async function (): Promise<string> {
        //             return await self.renderTemplateComponent(ctx.parent.template.name, ctx.component);
        //         }
        //     });
        // });

    }

    // async getTemplateComponent(templateName: string, templateComponent: string) {
    //     return await this.requests.readTemplate(templateName, templateComponent); // FIXME read files from template directly
    // }

    async getTemplateText(templateName: string, templateComponent: string) {
        console.assert(templateName);
        console.assert(templateComponent);
        const content = await this.apiClient.getDocumentContent(`template/${templateName}/${templateComponent}`);
        console.assert(content);
        return Handlebars.compile(content);
    }

    async renderTemplateText(templateName: string, templateComponent: string, ctx: any = {}) {
        console.assert(templateName);
        console.assert(templateComponent);
        const template = await this.getTemplateText(templateName, templateComponent);
        return template(Object.assign({
            template: {
                name: templateName,
                component: templateComponent
            },
            window: {
                location: {
                    bookmark: window.location.hash.slice(1)
                }
            }
        }, ctx));
    }

    async renderTemplateComponentToElement(templateName: string, templateComponent: string, elementId: string) {
        const content = await this.renderTemplateText(templateName, templateComponent);
        const container = document.getElementById(elementId);
        container.innerHTML = content
        // FIXME use template client-side template engine ?
        // FIXME need a lot of caching to avoid too much requests ?
        // FIXME avoid to send restricted data if user has no permissions

        await this.execCustomHooks(elementId);
    }

    async includeTemplateComponentAsStyle(templateName: string, templateComponent: string) {
        const content = await this.renderTemplateText(templateName, templateComponent);
        const styles = document.createElement('style');
        // styles.type="text/css";
        // styles.rel="stylesheet";
        styles.innerHTML = content;
        // styles.href="./css/style.css";
        document.head.appendChild(styles);
    }

    async renderImage(templateName: string, templateComponent: string) {
        // const content = await this.renderTemplateText(templateName, templateComponent);
        const image = document.createElement('image');
        image.setAttribute('src', `/api/wiki/${templateName}/${templateComponent}`);
        // styles.innerHTML = content;
        // styles.href="./css/style.css";
        // document.head.appendChild(image);
        return image.outerHTML;
    }

    async execCustomHooks(rootElementId: string = undefined) {
        /*
         injected scripts don't run, nor events are dispatched
         thus we search for special hooks in the new rendered code and
         do related things
         */
        // console.debug("execCustomHooks", rootElementId, document.getElementById(rootElementId));
        let rootElement = document.getElementById(rootElementId);
        for (let element of document.querySelectorAll('[dispatchEvent]')) {
            const eventName = element.getAttribute("dispatchEvent");
            document.dispatchEvent(new CustomEvent(eventName, {detail: {origin: element}}));
        }
    }
}