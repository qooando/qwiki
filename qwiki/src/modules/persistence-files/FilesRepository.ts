import {Objects} from "@qwiki/core/utils/Objects";
import {__Bean__} from "@qwiki/core/beans/__Bean__";
import {Value} from "@qwiki/core/beans/Value";
import {Base} from "@qwiki/core/base/Base";


export class FilesRepository extends Base {
    static __bean__: __Bean__ = {
        loadCondition: () => Objects.getValueOrDefault($qw.config, "qwiki.persistence.files", false)
    }

    basePath: string = Value("qwiki.persistence.files.basePath", "./data")


}