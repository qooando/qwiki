export type ClassConstructor<T> = (new (...args: any[]) => T);
export type FilterFunction<T> = ((x: T) => boolean);
export type KeyFunction<T> = ((x: T) => string | string[]);