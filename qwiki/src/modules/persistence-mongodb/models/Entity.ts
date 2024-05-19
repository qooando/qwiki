export interface __ENTITY__ {
    collection: string
    typeAlias: string
}

export interface Entity {
    // __entity__: __ENTITY__

    [x: string]: any;
    // [x: (string | number | symbol)]: unknown;
}
