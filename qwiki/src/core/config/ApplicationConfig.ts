export interface ApplicationConfig {
    qwiki: QwikiConfig

}

export interface QwikiConfig {
    modules: ModulesConfig
}

export interface ModulesConfig {
    searchPaths: Array<string>
    policies?: Map<string, string>
}
