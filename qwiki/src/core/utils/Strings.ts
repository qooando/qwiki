export class Strings {

    static format(text: string, ...items: string[]) {
        for (let item of items) {
            text = text.replace(/{}/g, item);
        }
        return text;
    }

    static capitalize(text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // static strikethrough(value: string) {
    //     return value.replace(/./g, "$&\u0336");
    // }
}