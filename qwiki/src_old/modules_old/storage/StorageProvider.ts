// import {Base} from "@qwiki/core/base/Base";
// import {NotImplementedException} from "@qwiki/core/utils/Exceptions";
// import {PermissiveURL} from "@qwiki/modules/persistence/models/PermissiveURL";
// import {WikiDocumentNotFoundException} from "@qwiki/modules/wiki/WikiExceptions";
//
// export class StorageProvider extends Base {
//
//     declare supportedProtocols: string[];
//
//     async read(url: PermissiveURL): Promise<string> {
//         throw new NotImplementedException();
//     }
//
//     async write(url: PermissiveURL, content: string): Promise<void> {
//         throw new NotImplementedException();
//     }
//
//     exists(url: PermissiveURL): boolean {
//         return this._exists(url);
//     }
//
//     _exists(url: PermissiveURL): boolean {
//         throw new NotImplementedException();
//     }
//
//     _findValidUrl(url: PermissiveURL, searchPaths: string[] = []): PermissiveURL {
//         if (!searchPaths || !searchPaths.length) {
//             if (this.exists(url)) {
//                 return url;
//             }
//             throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
//         }
//         let validUrl = searchPaths
//             .map(prefix => url.withPathPrefix(prefix))
//             .filter(url => this._exists(url.withoutScheme()))[0];
//         if (!validUrl) {
//             throw new WikiDocumentNotFoundException(`Document not found: ${url}`, url.toString());
//         }
//         return validUrl;
//     }
//
// }
//
