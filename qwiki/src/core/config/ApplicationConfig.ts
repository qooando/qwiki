import {ServerConfig} from "@qwiki/modules/server/ServerConfig";

export interface ApplicationConfig {
    qwiki: QwikiConfig
}

export interface QwikiConfig {
    modules: ModulesConfig
    servers: any
    persistence: any
}

export interface ModulesConfig {
    searchPaths: Array<string>
    policies?: Map<string, string>
}
