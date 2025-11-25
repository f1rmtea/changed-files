import * as core from '@actions/core';
import { AreaResult } from '../types';

export async function createSummary(results: Record<string, AreaResult>): Promise<void> {
  const changedAreas = Object.entries(results).filter(([_, result]) => result.changed);
  const unchangedAreas = Object.entries(results).filter(([_, result]) => !result.changed);

  const summary = core.summary
    .addHeading('📊 Changed Areas Analysis', 2)
    .addRaw('\n');

  if (changedAreas.length > 0) {
    summary.addHeading('✅ Changed Areas', 3);
    
    const changedTable = [
      [
        { data: 'Area', header: true },
        { data: 'Files Changed', header: true },
        { data: 'Status', header: true }
      ],
      ...changedAreas.map(([name, result]) => [
        name,
        result.count.toString(),
        '✅ Changed'
      ])
    ];

    summary.addTable(changedTable).addRaw('\n');
  }

  if (unchangedAreas.length > 0) {
    summary.addHeading('⚪ Unchanged Areas', 3);
    
    const unchangedTable = [
      [
        { data: 'Area', header: true },
        { data: 'Status', header: true }
      ],
      ...unchangedAreas.map(([name, _]) => [name, '⚪ No changes'])
    ];

    summary.addTable(unchangedTable).addRaw('\n');
  }

  const totalFiles = Object.values(results).reduce((sum, r) => sum + r.count, 0);
  summary.addRaw(`\n**Total files analyzed:** ${totalFiles}\n`);

  await summary.write();
}