import {Qlient} from "@qlient/Qlient.js";

console.log("Load client-side qwiki")

declare global {
    var $ql: Qlient
}

$ql = new Qlient();
$ql.boot();



