import {Base} from "./Base.js";
import {WikiDocumentDto} from "./dto/WikiDocumentDto.js";

export class ApiClient extends Base {

    pathPrefix = "/api"

    makeURL(path: string) {
        let currentURL = new URL(window.location.href);
        currentURL.pathname = `${this.pathPrefix}${path}`;
        return currentURL;
    }

    async request(url: URL, options: any = {}) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
        options = Object.assign({
            // default parameters
            // FIXME bearer token
        }, options)
        return await fetch(url, options);
    }

    async login(username: string, password: string) {
        // FIXME
    }

    async logout() {
        // FIXME
    }

    async getDocumentContent(identifier: string): Promise<string> {
        let url = this.makeURL(`/wiki/${identifier}`);
        let response = await this.request(url, {
            method: "GET"
        })
        if (response.status === 200) {
            if (identifier.endsWith(".json") || identifier.endsWith(".yaml")) {
                return response.json();
            } else {
                return response.blob().then(b => b.text());
            }
        } else {
            return `<Doc not found: ${identifier}>`
        }
    }

    async getDocumentMetadata(identifier: string): Promise<WikiDocumentDto> {
        let url = this.makeURL(`/wiki/${identifier}.meta`);
        let response = await this.request(url, {
            method: "GET"
        })
        if (response.status === 200) {
            return response.json().then(j => new WikiDocumentDto(j));
        } else {
            return null;
        }
    }

    async writeDocument(identifier: string, document: WikiDocumentDto): Promise<void> {
        // FIXME
    }

    // async readTemplate(templateName: string, componentPath: string): Promise<Response> {
    //     let url = this.makeURL(`/templates/${templateName}/${componentPath}`);
    //     return await this.request(url, {
    //         method: "GET"
    //     })
    // }
    //
    // async readTemplateDocument(templateName: string, componentPath: string): Promise<WikiDocumentDto> {
    //     let url = this.makeURL(`/templates/${templateName}/${componentPath}`);
    //     return await this.request(url, {
    //         method: "GET"
    //     })
    //         .then(response => response.json())
    //         .then(jsonResponse => new WikiDocumentDto(jsonResponse));
    // }

}
