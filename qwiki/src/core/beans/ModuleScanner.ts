import {__Bean__} from "./__Bean__";
import {BeanScope} from "./BeanUtils";
import {glob} from "glob";
import {Bean} from "@qwiki/core/beans/Bean";
import * as path from "node:path";
import * as fs from "node:fs";

export class ModuleScanner {
    supportedExtensions: string[] = [
        ".js",
        ".ts"
    ];

    findFilesSync(...searchPaths: string[]): string[] {
        const re = new RegExp(this.supportedExtensions.map(x => `${x}$`).join("|"))
        return glob.globSync(searchPaths, {})
            .map(p => path.isAbsolute(p) ? p : path.resolve(p))
            .filter(p => fs.statSync(p).isFile())
            .filter(p => re.test(p));
    }

    async findFiles(...searchPaths: string[]): Promise<string[]> {
        return this.findFilesSync(...searchPaths);
    }

    async findBeansByPaths(...searchPaths: string[]): Promise<Bean[]> {
        return (await this.findFiles(...searchPaths)
            .then((files: string[]) => Promise.all(
                    files.flatMap(file => this.findBeansByPath(file))
                )
            )).flatMap(x => x);
    }

    async findBeansByPath(path: string): Promise<Bean[]> {
        throw new Error(`Not implemented`)
    }

}
