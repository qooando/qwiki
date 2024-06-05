import {Base} from "./Base.js";
import {ApiClient} from "./ApiClient.js";
import {TemplateEngine} from "./TemplateEngine.js";

export interface QlientConfig {
    templateName: string;
    templateMainPage: string;
    templateMainContainerId: string;
}

export class Qlient extends Base {

    apiClient = new ApiClient();
    templateEngine = new TemplateEngine();
    config: QlientConfig;
    defaultConfigFile = "qlient.config.json";

    async boot() {
        this.config = Object.assign(
            {
                templateName: "default",
                templateMainPage: "index.html",
                templateMainContainerId: "main-container"
            },
            (await this.apiClient.getDocumentContent(this.defaultConfigFile)) ?? {}
        );

        // refresh page if fragment changes
        addEventListener("hashchange", (event) => {
            this.render();
        });

        // first refresh
        this.render();
    }

    async render() {
        await this.templateEngine.renderTemplateComponentToElement(
            this.config.templateName,
            this.config.templateMainPage,
            this.config.templateMainContainerId);

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