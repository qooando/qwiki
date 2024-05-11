import {Qlient} from "@qlient/scripts/Qlient.js";

console.log("Load client-side qwiki")

declare global {
    var $ql: Qlient
}

$ql = new Qlient();
$ql.boot();

"before"


