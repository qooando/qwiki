export class Strings {

    static format(text: string, ...items: string[]) {
        for (let item of items) {
            text = text.replace(/{}/g, item);
        }
        return text;
    }

    // static strikethrough(value: string) {
    //     return value.replace(/./g, "$&\u0336");
    // }
}