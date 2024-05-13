import {Base} from "./Base.js";
import {Requests} from "./Requests.js";
import * as Handlebars from "handlebars";
import {replaceOnPromise} from "./snippets/replaceOnPromise.js";

export enum PartialNames {
    INCLUDE = "include"
}

export enum HelperNames {
    INCLUDE = "include"
}

export class TemplateEngine extends Base {

    requests = new Requests();

    postConstruct() {
        const templateEngine = this;

        // {{ include "test.html" }}
        Handlebars.registerHelper(HelperNames.INCLUDE, function (component) {
            // NOTE: this is the current context
            const parentCtx = this;
            return replaceOnPromise(async function (): Promise<string> {
                return await templateEngine.renderTemplateComponent(parentCtx.template.name, component);
            });
        })

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

    async getTemplateComponent(templateName: string, templateComponent: string) {
        const templateDoc = await this.requests.readTemplate(templateName, templateComponent);
        const content = templateDoc.content;
        return Handlebars.compile(content);
    }

    async renderTemplateComponent(templateName: string, templateComponent: string) {
        const template = await this.getTemplateComponent(templateName, templateComponent);
        return template({
            template: {
                name: templateName,
                component: templateComponent
            }
        });
    }

    async renderTemplateComponentToElement(templateName: string, templateComponent: string, elementId: string) {
        const content = await this.renderTemplateComponent(templateName, templateComponent);
        const container = document.getElementById(elementId);
        container.innerHTML = content
        // FIXME use template client-side template engine ?
        // FIXME need a lot of caching to avoid too much requests ?
        // FIXME avoid to send restricted data if user has no permissions

        await this.execCustomHooks(elementId);
    }

    async includeTemplateComponentAsStyle(templateName: string, templateComponent: string) {
        const content = await this.renderTemplateComponent(templateName, templateComponent);
        const styles = document.createElement('style');
        // styles.type="text/css";
        // styles.rel="stylesheet";
        styles.innerHTML = content;
        // styles.href="./css/style.css";
        document.head.appendChild(styles);
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