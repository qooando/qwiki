import {Qlient} from "@qlient/Qlient.js";

console.log("Load client-side qwiki")

declare global {
    var $ql: Qlient
}

var $ql = new Qlient();
$ql.boot();



