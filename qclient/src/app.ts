import {Qlient} from "@qlient/scripts/Qlient";

console.log("Load client-side qwiki")

declare global {
    var $ql: Qlient
}

$ql = new Qlient();
$ql.boot();



