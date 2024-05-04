import {Base} from "@qlient/Base.js";
import {Requests} from "@qlient/Requests.js";

export class Qlient extends Base {

    mainContainerId = "main";
    requests = new Requests();

    boot() {
        // refresh page if fragment changes
        addEventListener("hashchange", (event) => {
            this.refresh();
        });

        // first refresh
        this.refresh();
    }

    async refresh() {
        /*
            read url #/path
            ask to backend the /path
            pass content to template engine
            render as... html
         */
        let fragment = window.location.hash.slice(1);
        let wikidoc = await this.requests.readDocument(fragment);
        let mainContainer = document.getElementById(this.mainContainerId);
        mainContainer.innerHTML = wikidoc.content.toString();
    }
}