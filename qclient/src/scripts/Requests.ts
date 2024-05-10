import {Base} from "./Base";
import {WikiDocumentDto} from "./dto/WikiDocumentDto";

export class Requests extends Base {

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

    async readDocument(identifier: string): Promise<WikiDocumentDto> {
        let url = this.makeURL(`/wiki/${identifier}`);
        return await this.request(url, {
            method: "GET"
        })
            .then(response => response.json())
            .then(jsonResponse => new WikiDocumentDto(jsonResponse));
    }

    async writeDocument(identifier: string, document: WikiDocumentDto): Promise<void> {
        // FIXME
    }

    async readTemplate(templateName: string, componentPath: string): Promise<WikiDocumentDto> {
        let url = this.makeURL(`/templates/${templateName}/${componentPath}`);
        return await this.request(url, {
            method: "GET"
        })
            .then(response => response.json())
            .then(jsonResponse => new WikiDocumentDto(jsonResponse));
    }
}
