import {Qlient} from "@qlient/scripts/Qlient.js";

console.log("Load client-side qwiki")

declare global {
    var $qlient: Qlient
}

globalThis.$qlient = new Qlient();
$qlient.boot();



