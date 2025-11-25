import { AreaConfig, AreaResult, ChangedFile } from '../types';

export function applyConstraints(
  _areaName: string,  // Prefix with _ to indicate intentionally unused
  matchedFiles: ChangedFile[],
  areaConfig: AreaConfig
): AreaResult {
  const fileCount = matchedFiles.length;

  // Check min_changed_files
  if (areaConfig.min_changed_files && fileCount < areaConfig.min_changed_files) {
    return {
      changed: false,
      files: [],
      count: 0,
      reason: `Only ${fileCount} file(s) changed, minimum is ${areaConfig.min_changed_files}`
    };
  }

  return {
    changed: fileCount > 0,
    files: matchedFiles.map(f => f.path),
    count: fileCount
  };
}

export function applyConstraintsToAll(
  classified: Record<string, ChangedFile[]>,
  areas: Record<string, AreaConfig>
): Record<string, AreaResult> {
  const results: Record<string, AreaResult> = {};

  for (const [areaName, files] of Object.entries(classified)) {
    const areaConfig = areas[areaName];
    results[areaName] = applyConstraints(areaName, files, areaConfig);
  }

  return results;
}