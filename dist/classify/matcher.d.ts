import { ChangedFile, AreaConfig } from '../types';
export declare function classifyFile(file: ChangedFile, areaConfig: AreaConfig): boolean;
export declare function classifyFiles(files: ChangedFile[], areas: Record<string, AreaConfig>): Record<string, ChangedFile[]>;
//# sourceMappingURL=matcher.d.ts.map