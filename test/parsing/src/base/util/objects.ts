// export function deepClone(source: any): any {
//     if (Array.isArray(source)) {
//         return [...source.map(deepClone)];
//     } else if (typeof source === 'object') {
//         return Object.fromEntries(
//             Object.entries(source)
//                 .map((e, i, a) => {
//                     if (Array.isArray(e[1])) {
//                         return [e[0], e[1].map(deepClone)]
//                     }
//                     return e;
//                 })
//         );
//     } else {
//         return source;
//     }
// }
//
// export function deepAssign(...sources: any[]) {
//     return deepClone(Object.assign({}, ...sources));
// }