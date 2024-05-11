// import * as _ from 'lodash';
//
// function component() {
//     const element = document.createElement('div');
//
//     // Lodash, now imported by this script
//     element.innerHTML = _.join(['Hello', 'webpack'], ' ');
//
//     return element;
// }
//
// document.body.appendChild(component());

import {Qlient} from "@qlient/scripts/Qlient";

console.log("Qlient start...")

declare global {
    var $qlient: Qlient
}

globalThis.$qlient = new Qlient();
$qlient.boot();



