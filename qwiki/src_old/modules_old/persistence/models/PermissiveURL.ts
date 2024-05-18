import {NotImplementedException, RuntimeException} from "../../../../src/core/utils/Exceptions";

export class PermissiveURL {

    _uriRegExp = /^(?<scheme>\w[\w._+\-]*)?:(\/\/?<authority>(?<userinfo>[^@]+@)?(?<host>[\w._\-]+)(:(?<port>\d+))?)?\/(?<path>[^?]*)(\?(?<query>[^#]+))?(#(?<fragment>.*))?$/;
    _queryRegExp = /([^&]+)+/

    scheme: string;
    authority: string;
    userinfo: string;
    host: string;
    port: string;
    path: string;
    query: string;
    fragment: string;

    constructor(source: PermissiveURL | string | any) {
        if (source instanceof PermissiveURL) {
            Object.assign(this, source);
        } else if (typeof source === 'string') {
            let result = this._uriRegExp.exec(source);
            this._uriRegExp.lastIndex = 0;
            if (!result.groups) {
                throw new RuntimeException(`Failed to parse permissive URL: ${source}`);
            }
            let params = result.groups;
            Object.assign(this, params);
        }
    }

    // FIXME
    get params(): any {
        throw new NotImplementedException();
        // return new Map(
        //     this._queryRegExp.exec(this.query).groups
        // );
    }

    toString() {
        return this.scheme + ":"
            + (this.authority ? "//" + this.authority : "")
            + this.path
            + (this.query ? "?" + this.query : "")
            + (this.fragment ? "#" + this.fragment : "");
    }

    toUrl() {
        return new URL(this.toString());
    }

    get url() {
        return this.toString();
    }

    withPathPrefix(prefix: string) {
        let a = new PermissiveURL(this);
        a.path = prefix + "/" + a.path;
        return a;
    }

    withPathSuffix(suffix: string) {
        let a = new PermissiveURL(this);
        a.path = a.path + "/" + suffix
        return a;
    }

    withScheme(scheme: string) {
        let a = new PermissiveURL(this);
        a.scheme = scheme;
        return a;
    }

    withoutScheme() {
        let a = new PermissiveURL(this);
        a.scheme = undefined;
        return a;
    }
}