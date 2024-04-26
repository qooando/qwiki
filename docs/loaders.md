# Loaders

Loaders permit to load beans from files.

Default loaders are:

- JavascriptLoader
- TypescriptScanner

More loaders are available in modules

Those loaders permits to load content from file
given the file mimetype.

## Implement a loader

Write down your bean as subclass of `Loader` class.

```ts
import {__Bean__} from "../beans/__Bean__";
import {Loader} from "./Loader";

export class TypescriptScanner extends Loader {
    static __bean__: __Bean__ = {
        dependsOn: []
    }

    supportedMimeTypes: Array<string> = [
        "video/mp2t", // .ts
    ]

    async load(path: string) {
        return await import(path);
    }
}
```

the `supportedMimeTypes` must be a list of mimetypes the loader
can manage. Mimetypes are inferred by file extension.

