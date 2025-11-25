import { AreaConfig, AreaResult, ChangedFile } from '../types';
export declare function applyConstraints(_areaName: string, // Prefix with _ to indicate intentionally unused
matchedFiles: ChangedFile[], areaConfig: AreaConfig): AreaResult;
export declare function applyConstraintsToAll(classified: Record<string, ChangedFile[]>, areas: Record<string, AreaConfig>): Record<string, AreaResult>;
//# sourceMappingURL=constraints.d.ts.map