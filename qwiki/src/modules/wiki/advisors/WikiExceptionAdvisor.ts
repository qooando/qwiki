import {ExpressAdvisor} from "@qwiki/modules/express/ExpressAdvisor";
import {Value} from "@qwiki/core/beans/Value";
import {WikiDocumentException, WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
import {HttpStatus} from "@qwiki/modules/express/constants/HttpStatus";
import {ErrorDto, WikiDocumentErrorDto, WikiDocumentNotFoundErrorDto} from "@qlient/dto/ErrorDto";
import {getFullStackTrace, RuntimeException} from "@qwiki/core/utils/Exceptions";

export class WikiExceptionAdvisor extends ExpressAdvisor {
    static __bean__ = {}

    servers = Value("qwiki.wiki.servers", ["wiki"], false);

    // @ts-ignore
    advisor_WikiDocumentNotFound(err, req, res, next) {
        if (err instanceof WikiDocumentNotFoundException) {
            this.log.error(err.message);
            res.status(HttpStatus.NOT_FOUND)
                .send(new WikiDocumentNotFoundErrorDto(err.message, err.document))
        } else {
            next(err)
        }
    }

    // @ts-ignore
    advisor_WikiDocumentException(err, req, res, next) {
        if (err instanceof WikiDocumentException) {
            this.log.error(getFullStackTrace(err));
            res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send(new WikiDocumentErrorDto(err.message, err.document))
        } else {
            next(err)
        }
    }

    // @ts-ignore
    advisor_any(err, req, res, next) {
        if (err instanceof Error) {
            this.log.error(getFullStackTrace(err));
            res.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send(new ErrorDto(err.message))
        } else {
            next(err)
        }
    }

}