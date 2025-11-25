import { applyConstraints, applyConstraintsToAll } from '../src/classify/constraints';
import { ChangedFile, AreaConfig } from '../src/types';

describe('Constraints', () => {
  describe('applyConstraints', () => {
    describe('minimum changed files constraint', () => {
      it('should pass when file count meets minimum', () => {
        const files: ChangedFile[] = [
          { path: 'src/file1.ts', status: 'modified', binary: false },
          { path: 'src/file2.ts', status: 'modified', binary: false },
          { path: 'src/file3.ts', status: 'modified', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**'],
          min_changed_files: 3
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(true);
        expect(result.count).toBe(3);
        expect(result.files).toEqual(['src/file1.ts', 'src/file2.ts', 'src/file3.ts']);
        expect(result.reason).toBeUndefined();
      });

      it('should pass when file count exceeds minimum', () => {
        const files: ChangedFile[] = [
          { path: 'src/file1.ts', status: 'modified', binary: false },
          { path: 'src/file2.ts', status: 'modified', binary: false },
          { path: 'src/file3.ts', status: 'modified', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**'],
          min_changed_files: 2
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(true);
        expect(result.count).toBe(3);
      });

      it('should fail when file count is below minimum', () => {
        const files: ChangedFile[] = [
          { path: 'src/file1.ts', status: 'modified', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**'],
          min_changed_files: 3
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(false);
        expect(result.count).toBe(0);
        expect(result.files).toEqual([]);
        expect(result.reason).toBe('Only 1 file(s) changed, minimum is 3');
      });

      it('should handle exact boundary case', () => {
        const files: ChangedFile[] = [
          { path: 'src/file1.ts', status: 'modified', binary: false },
          { path: 'src/file2.ts', status: 'modified', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**'],
          min_changed_files: 2
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(true);
        expect(result.count).toBe(2);
      });

      it('should handle zero changed files with minimum constraint', () => {
        const files: ChangedFile[] = [];

        const config: AreaConfig = {
          include: ['src/**'],
          min_changed_files: 1
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(false);
        expect(result.count).toBe(0);
        expect(result.reason).toBe('Only 0 file(s) changed, minimum is 1');
      });
    });

    describe('no constraints', () => {
      it('should return changed=true for any matched files', () => {
        const files: ChangedFile[] = [
          { path: 'src/file1.ts', status: 'modified', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**']
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(true);
        expect(result.count).toBe(1);
        expect(result.files).toEqual(['src/file1.ts']);
      });

      it('should return changed=false for no matched files', () => {
        const files: ChangedFile[] = [];

        const config: AreaConfig = {
          include: ['src/**']
        };

        const result = applyConstraints('backend', files, config);

        expect(result.changed).toBe(false);
        expect(result.count).toBe(0);
        expect(result.files).toEqual([]);
      });
    });

    describe('file path extraction', () => {
      it('should extract only file paths in result', () => {
        const files: ChangedFile[] = [
          { path: 'src/api.ts', status: 'modified', binary: false },
          { path: 'src/utils.ts', status: 'added', binary: false },
          { path: 'src/old.ts', status: 'removed', binary: false }
        ];

        const config: AreaConfig = {
          include: ['src/**']
        };

        const result = applyConstraints('backend', files, config);

        expect(result.files).toEqual(['src/api.ts', 'src/utils.ts', 'src/old.ts']);
        expect(result.count).toBe(3);
      });
    });
  });

  describe('applyConstraintsToAll', () => {
    it('should apply constraints to multiple areas', () => {
      const classified = {
        backend: [
          { path: 'src/api.ts', status: 'modified' as const, binary: false },
          { path: 'src/db.ts', status: 'modified' as const, binary: false }
        ],
        frontend: [
          { path: 'ui/app.tsx', status: 'modified' as const, binary: false }
        ],
        docs: [
          { path: 'README.md', status: 'modified' as const, binary: false }
        ]
      };

      const areas = {
        backend: { include: ['src/**'] },
        frontend: { include: ['ui/**'] },
        docs: { include: ['*.md'] }
      };

      const results = applyConstraintsToAll(classified, areas);

      expect(results.backend.changed).toBe(true);
      expect(results.backend.count).toBe(2);
      expect(results.frontend.changed).toBe(true);
      expect(results.frontend.count).toBe(1);
      expect(results.docs.changed).toBe(true);
      expect(results.docs.count).toBe(1);
    });

    it('should apply min_changed_files constraint to each area independently', () => {
      const classified = {
        backend: [
          { path: 'src/api.ts', status: 'modified' as const, binary: false }
        ],
        frontend: [
          { path: 'ui/app.tsx', status: 'modified' as const, binary: false },
          { path: 'ui/styles.css', status: 'modified' as const, binary: false }
        ]
      };

      const areas = {
        backend: { include: ['src/**'], min_changed_files: 2 },
        frontend: { include: ['ui/**'], min_changed_files: 2 }
      };

      const results = applyConstraintsToAll(classified, areas);

      expect(results.backend.changed).toBe(false);
      expect(results.backend.reason).toContain('minimum is 2');
      expect(results.frontend.changed).toBe(true);
      expect(results.frontend.count).toBe(2);
    });

    it('should handle empty classified areas', () => {
      const classified = {
        backend: [],
        frontend: []
      };

      const areas = {
        backend: { include: ['src/**'] },
        frontend: { include: ['ui/**'] }
      };

      const results = applyConstraintsToAll(classified, areas);

      expect(results.backend.changed).toBe(false);
      expect(results.backend.count).toBe(0);
      expect(results.frontend.changed).toBe(false);
      expect(results.frontend.count).toBe(0);
    });

    it('should return results for all areas even if some are empty', () => {
      const classified = {
        backend: [{ path: 'src/api.ts', status: 'modified' as const, binary: false }],
        frontend: [],
        docs: [{ path: 'README.md', status: 'modified' as const, binary: false }]
      };

      const areas = {
        backend: { include: ['src/**'] },
        frontend: { include: ['ui/**'] },
        docs: { include: ['*.md'] }
      };

      const results = applyConstraintsToAll(classified, areas);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results.backend.changed).toBe(true);
      expect(results.frontend.changed).toBe(false);
      expect(results.docs.changed).toBe(true);
    });
  });
});