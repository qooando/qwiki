import {INotifyWait} from "../../src/modules/inotifywait/INotifyWait";
import * as path from "node:path";

describe('INotifyWait', () => {

    test('Test', () => {
        let e = new INotifyWait(path.join(process.cwd(), "build", "data"), {recursive: true});



    });

});
