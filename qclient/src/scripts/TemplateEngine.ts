import {Base} from "./Base.js";
import {Requests} from "./Requests.js";
import * as Handlebars from "handlebars";
import {replaceOnPromise} from "./snippets/replaceOnPromise.js";

export class TemplateEngine extends Base {

    requests = new Requests();

    postConstruct() {
        const self = this;
        Handlebars.registerHelper('include', function (templateComponent) {
            // NOTE: this is the current context
            return replaceOnPromise(() => self.renderTemplateComponent(this.template.name, templateComponent));
        })
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
    }

}