import * as uuid from "uuid";
import * as Handlebars from "handlebars";

export function replaceOnPromise(promiseSupplier: () => Promise<string>): Handlebars.SafeString {
    const uniqueId = uuid.v4();
    const eventName = `replace_${uniqueId}`;
    document.addEventListener(eventName, event => {
        promiseSupplier().then((content) => {
            document.getElementById(uniqueId).outerHTML = content;
        }) // FIXME on error ?
    });
    // leverage the execCustomHooks() in TemplateEngine
    const html = `<div id=${uniqueId} dispatchEvent="${eventName}"></div>`
    return new Handlebars.SafeString(html);
}