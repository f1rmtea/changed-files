export declare class ConfigError extends Error {
    constructor(message: string);
}
export declare class GitHubAPIError extends Error {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
