import * as core from '@actions/core';
import { AreaResult } from '../types';

export async function createSummary(results: Record<string, AreaResult>): Promise<void> {
  const changedSections = Object.entries(results).filter(([_, result]) => result.changed);
  const unchangedSections = Object.entries(results).filter(([_, result]) => !result.changed);

  const summary = core.summary
    .addHeading('Changed Files Analysis', 2)
    .addRaw('\n');

  if (changedSections.length > 0) {
    summary.addHeading('Changed', 3);
    
    const changedTable = [
      [
        { data: 'Section', header: true },
        { data: 'Files Changed', header: true },
        { data: 'Status', header: true }
      ],
      ...changedSections.map(([name, result]) => [
        name,
        result.count.toString(),
        '✅ Changed'
      ])
    ];

    summary.addTable(changedTable).addRaw('\n');
  }

  if (unchangedSections.length > 0) {
    summary.addHeading('Unchanged', 3);
    
    const unchangedTable = [
      [
        { data: 'Section', header: true },
        { data: 'Status', header: true }
      ],
      ...unchangedSections.map(([name, _]) => [name, '⚪ No changes'])
    ];

    summary.addTable(unchangedTable).addRaw('\n');
  }

  const totalFiles = Object.values(results).reduce((sum, r) => sum + r.count, 0);
  summary.addRaw(`\n**Total files analyzed:** ${totalFiles}\n`);

  await summary.write();
}