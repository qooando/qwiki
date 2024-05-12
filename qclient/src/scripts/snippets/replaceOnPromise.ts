import * as uuid from "uuid";

// function onReady(callback: () => void): void {
//     if (document.readyState !== 'loading') {
//         callback();
//     } else {
//         document.addEventListener('DOMContentLoaded', callback);
//     }
// }
//
// onReady(() => {
// // Your code here
// });

export function replaceOnPromise(call: () => Promise<string>): string {
    let uniqueId = uuid.v4();
    document.addEventListener('DOMContentLoaded', event => {
        console.log("DOMContentLoaded", event);
        call().then((content) => {
            console.log("DOMContentLoaded 2", event);
            document.getElementById(uniqueId).outerHTML = content;
        }) // FIXME on error ?
    });
    return `<div id="${uniqueId}"></div>`
}