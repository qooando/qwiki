import {Base} from "./Base.js";
import {Requests} from "./Requests.js";
import {TemplateEngine} from "./TemplateEngine.js";

export class Qlient extends Base {

    requests = new Requests();
    templateEngine = new TemplateEngine();
    config: any;

    async boot() {
        this.config = await this.getConfig();

        // refresh page if fragment changes
        addEventListener("hashchange", (event) => {
            this.refresh();
        });

        // first refresh
        this.refresh();
    }

    async getConfig() {
        let wikiname = "default"
        let doc = await this.requests.readDocument(`${wikiname}/wiki.json`);
        if (doc)
            return doc.content;
    }

    async getRawTemplate() {
        return await this.requests.readDocument(this.config.qlient.template.templateDocumentId)
    }

    async refresh() {
        /*
            load template
            read url #/path
            ask to backend the /path
            pass content to template engine
            render as... html
         */
        this.templateEngine.renderTemplateComponentToElement(
            this.config.template.name,
            "main.html",
            this.config.template.mainContainerId);

        // let templateDoc = await this.requests.readTemplate(
        //     this.config.template.name,
        //     "main.html"
        // )
        // let mainContainer = document.getElementById(this.config.qlient.template.mainContainerId);
        // // FIXME use template client-side template engine ?
        // // FIXME need a lot of caching to avoid too much requests ?
        // // FIXME avoid to send restricted data if user has no permissions
        // mainContainer.innerHTML = templateDoc.content;


        // let document = await fetch(this.config.qlient.template.urlPath)
        // fixme render as html
        // mainContainer.innerHTML = wikidoc.content.toString();
        //
        // let fragment = window.location.hash.slice(1);
        // let wikidoc = await this.requests.readDocument(fragment);
        // mainContainer.innerHTML = wikidoc.content.toString();
    }
}