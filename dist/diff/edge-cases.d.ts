import { GitHubContext, EdgeCaseConfig, ChangedFile } from '../types';
interface PushEvent {
    before: string;
    after: string;
    forced?: boolean;
}
export declare function isFirstCommit(event: PushEvent): boolean;
export declare function isForcePush(event: PushEvent): boolean;
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
export {};
//# sourceMappingURL=edge-cases.d.ts.map