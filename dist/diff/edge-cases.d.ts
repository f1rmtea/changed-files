import { GitHubContext, EdgeCaseConfig, ChangedFile } from '../types';
export declare function isFirstCommit(event: any): boolean;
export declare function isForcePush(event: any): boolean;
export declare function isEmptyCommit(files: ChangedFile[]): boolean;
export declare function handleFirstCommit(sha: string): {
    strategy: string;
    ref: string;
};
export declare function handleForcePush(context: GitHubContext, config: EdgeCaseConfig): {
    strategy: string;
    ref: string;
};
export declare function handleEmptyCommit(config: EdgeCaseConfig): {
    strategy: string;
    triggerAll: boolean;
};
//# sourceMappingURL=edge-cases.d.ts.map