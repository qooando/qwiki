export interface ILoader {
    supportedMimeTypes: Array<string>

    loadCandidateBeans(path: string): Promise<[string, any][]>;
}