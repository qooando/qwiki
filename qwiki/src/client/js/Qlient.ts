import {Base} from "@qlient/Base.js";

export class Qlient extends Base {

    static mainContainerId = "main"

    boot() {
        // refresh page if fragment changes
        addEventListener("hashchange", (event) => {
            this.refresh();
        });

        // first refresh
        this.refresh();
    }

    refresh() {
        /*
            read url #/path
            ask to backend the /path
            pass content to template engine
            render as... html
         */
        let fragment = window.location.hash
        console.log(fragment);
        let mainContainer = document.getElementById(Qlient.mainContainerId);
        mainContainer.innerHTML = fragment;
    }
}