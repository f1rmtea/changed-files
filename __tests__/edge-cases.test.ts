import { isFirstCommit, isForcePush, isEmptyCommit } from '../src/diff/edge-cases';
import { ChangedFile } from '../src/types';

describe('Edge Case Detection', () => {
  describe('First Commit', () => {
    it('should detect zero SHA', () => {
      const event = {
        before: '0000000000000000000000000000000000000000',
        after: 'some-commit-hash',
        forced: false
      };

      expect(isFirstCommit(event)).toBe(true);
    });

    it('should detect non-zero SHA', () => {
      const event = {
        before: 'a1b2c3d4e5f6g7h8i9j0',
        after: 'some-commit-hash',
        forced: false
      };

      expect(isFirstCommit(event)).toBe(false);
    });
  });

  describe('Force Push', () => {
    it('should detect force push', () => {
      const event = {
        before: 'commit-before',
        after: 'commit-after',
        forced: true
      };

      expect(isForcePush(event)).toBe(true);
    });

    it('should detect normal push', () => {
      const event = {
        before: 'commit-before',
        after: 'commit-after',
        forced: false
      };

      expect(isForcePush(event)).toBe(false);
    });
  });

  describe('Empty Commit', () => {
    it('should detect empty file list', () => {
      const files: ChangedFile[] = [];

      expect(isEmptyCommit(files)).toBe(true);
    });

    it('should detect non-empty file list', () => {
      const files: ChangedFile[] = [
        {
          path: 'src/api.ts',
          status: 'modified',
          binary: false
        }
      ];

      expect(isEmptyCommit(files)).toBe(false);
    });
  });
});