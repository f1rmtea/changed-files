import { classifyFile, classifyFiles } from '../src/classify/matcher';
import { ChangedFile, AreaConfig } from '../src/types';
import { Logger } from '../src/utils/logger';

describe('File Matcher', () => {
  describe('Include patterns', () => {
    it('should match files with include patterns', () => {
      const file: ChangedFile = {
        path: 'src/backend/api.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**']
      };

      expect(classifyFile(file, config)).toBe(true);
    });

    it('should not match files outside include patterns', () => {
      const file: ChangedFile = {
        path: 'src/frontend/app.tsx',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**']
      };

      expect(classifyFile(file, config)).toBe(false);
    });
  });

  describe('Exclude patterns', () => {
    it('should exclude files matching exclude patterns', () => {
      const file: ChangedFile = {
        path: 'src/backend/api.test.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**'],
        exclude: ['**/*.test.ts']
      };

      expect(classifyFile(file, config)).toBe(false);
    });

    it('should match files not in exclude patterns', () => {
      const file: ChangedFile = {
        path: 'src/backend/api.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**'],
        exclude: ['**/*.test.ts']
      };

      expect(classifyFile(file, config)).toBe(true);
    });
  });

  describe('Extension filtering', () => {
    it('should filter by required extensions', () => {
      const tsFile: ChangedFile = {
        path: 'src/api.ts',
        status: 'modified',
        binary: false
      };

      const jsFile: ChangedFile = {
        path: 'src/api.js',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/**'],
        required_extensions: ['.ts', '.tsx']
      };

      expect(classifyFile(tsFile, config)).toBe(true);
      expect(classifyFile(jsFile, config)).toBe(false);
    });
  });

  describe('Binary file handling', () => {
    it('should exclude binary files when configured', () => {
      const file: ChangedFile = {
        path: 'assets/logo.png',
        status: 'modified',
        binary: true
      };

      const config: AreaConfig = {
        include: ['assets/**'],
        exclude_binary_files: true
      };

      expect(classifyFile(file, config)).toBe(false);
    });

    it('should include binary files by default', () => {
      const file: ChangedFile = {
        path: 'assets/logo.png',
        status: 'modified',
        binary: true
      };

      const config: AreaConfig = {
        include: ['assets/**']
      };

      expect(classifyFile(file, config)).toBe(true);
    });
  });

  describe('File status handling', () => {
    it('should ignore deleted files when configured', () => {
      const file: ChangedFile = {
        path: 'src/old-api.ts',
        status: 'removed',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/**'],
        ignore_deleted_files: true
      };

      expect(classifyFile(file, config)).toBe(false);
    });

    it('should ignore renamed files when configured', () => {
      const file: ChangedFile = {
        path: 'src/new-api.ts',
        status: 'renamed',
        previous_path: 'src/old-api.ts',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/**'],
        ignore_renamed_files: true
      };

      expect(classifyFile(file, config)).toBe(false);
    });
  });

  describe('Debug mode', () => {
    let infoSpy: jest.SpyInstance;

    beforeEach(() => {
      infoSpy = jest.spyOn(Logger, 'info').mockImplementation();
    });

    afterEach(() => {
      infoSpy.mockRestore();
    });

    it('should log debug messages when debug is enabled', () => {
      const file: ChangedFile = {
        path: 'src/backend/user.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**'],
        exclude: ['**/*.test.ts']
      };

      const debugCtx = { areaName: 'backend', debugEnabled: true };
      classifyFile(file, config, debugCtx);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] src/backend/user.ts matched include "src/backend/**"')
      );
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] src/backend/user.ts did not match any exclude')
      );
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] src/backend/user.ts ✓ matched')
      );
    });

    it('should not log debug messages when debug is disabled', () => {
      const file: ChangedFile = {
        path: 'src/backend/user.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**']
      };

      classifyFile(file, config);

      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('should log when file does not match include patterns', () => {
      const file: ChangedFile = {
        path: 'requirements.txt',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**']
      };

      const debugCtx = { areaName: 'backend', debugEnabled: true };
      classifyFile(file, config, debugCtx);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] requirements.txt did not match any include patterns')
      );
    });

    it('should log when file is ignored due to required_extensions', () => {
      const file: ChangedFile = {
        path: 'requirements.txt',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['**'],
        required_extensions: ['.py', '.pyx']
      };

      const debugCtx = { areaName: 'python', debugEnabled: true };
      classifyFile(file, config, debugCtx);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[python] requirements.txt ignored (extension ".txt" not in required_extensions')
      );
    });

    it('should log when file matches exclude pattern', () => {
      const file: ChangedFile = {
        path: 'src/backend/api.test.ts',
        status: 'modified',
        binary: false
      };

      const config: AreaConfig = {
        include: ['src/backend/**'],
        exclude: ['**/*.test.ts']
      };

      const debugCtx = { areaName: 'backend', debugEnabled: true };
      classifyFile(file, config, debugCtx);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] src/backend/api.test.ts matched exclude "**/*.test.ts"')
      );
    });

    it('should work with classifyFiles function', () => {
      const files: ChangedFile[] = [
        { path: 'src/backend/user.ts', status: 'modified', binary: false },
        { path: 'requirements.txt', status: 'modified', binary: false }
      ];

      const areas = {
        backend: { include: ['src/backend/**'] },
        python: { include: ['**'], required_extensions: ['.py'] }
      };

      classifyFiles(files, areas, true);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[backend] src/backend/user.ts matched include')
      );
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[python] requirements.txt ignored (extension')
      );
    });
  });
});