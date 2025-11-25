import * as core from '@actions/core';
import { AreaResult } from '../types';
import { Logger } from '../utils/logger';

export function generateOutputs(results: Record<string, AreaResult>): void {
  Logger.startGroup('Setting outputs');

  // Set per-area outputs
  for (const [areaName, result] of Object.entries(results)) {
    const sanitizedName = areaName.replace(/[^a-zA-Z0-9_]/g, '_');

    core.setOutput(`${sanitizedName}_changed`, result.changed.toString());
    core.setOutput(`${sanitizedName}_files`, result.files.join('\n'));
    core.setOutput(`${sanitizedName}_count`, result.count.toString());

    Logger.info(`[${areaName}] changed=${result.changed}, count=${result.count}`);
  }

  // Set JSON summary
  const summary = Object.fromEntries(
    Object.entries(results).map(([name, result]) => [
      name,
      {
        changed: result.changed,
        files: result.files,
        count: result.count
      }
    ])
  );

  core.setOutput('areas_json', JSON.stringify(summary));

  Logger.endGroup();
}