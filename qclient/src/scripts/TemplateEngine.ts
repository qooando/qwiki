import {Base} from "./Base.js";
import {Requests} from "./Requests.js";
import * as Handlebars from "handlebars";

const template = Handlebars.compile("Name: {{name}}");
console.log(template({name: "Nils"}));

export class TemplateEngine extends Base {

    requests = new Requests();

    async renderTemplateComponentToElement(templateName: string, templateComponent: string, elementId: string) {
        let templateDoc = await this.requests.readTemplate(templateName, templateComponent);
        let container = document.getElementById(elementId);
        let content = this.render(templateDoc.content, {
            title: "My title"
        });

        // const template = Handlebars.compile("Name: {{name}}");
        // console.log(template({ name: "Nils" }));
        // FIXME use template client-side template engine ?
        // FIXME need a lot of caching to avoid too much requests ?
        // FIXME avoid to send restricted data if user has no permissions
        container.innerHTML = content
    }

    render(content: string, context: any) {
        const template = Handlebars.compile(content);
        let result = template(context);
        // FIXME implement rendering
        // FIXME leverage https://handlebarsjs.com/ ?
        // FIXME furthermore, accept AST and convert them to the correct required output ?
        //      maybe --> for content wiki documents only, not for the whole application

        // NOTE: rendering may involve further requests of other templates, etc...
        // return content;
        return result;
    }

}